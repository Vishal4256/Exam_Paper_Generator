import Exam from '../models/Exam.model.js';
import Question from '../models/Question.model.js';
import PDFDocument from 'pdfkit';
import axios from 'axios';

const generateExam = async (req, res) => {
    try {
        const { examTitle, description, collegeName, institutionType, department, academicSession, courseCode, logo, examHeaderStyle, subject, topic, examDate, duration, instructions, marksDistribution, blueprint, difficulty } = req.body;

        let selectedQuestions = [];
        let totalCalculatedMarks = 0;
        let sectionedQuestions = [];
        let calculatedDuration = duration;

        if (blueprint && blueprint.length > 0) {
            calculatedDuration = 0;
            for (const section of blueprint) {
                const count = parseInt(section.questionCount);
                const marks = parseInt(section.marksPerQuestion);
                const sectionType = section.type || 'MCQ';
                
                calculatedDuration += parseInt(section.duration) || 0;

                if (count > 0) {
                    let query = { user: req.user.id, subject: subject, type: sectionType, status: 'active' };
                    if (section.difficulty && section.difficulty !== 'Mixed' && section.difficulty !== 'All') {
                        query.difficulty = section.difficulty;
                    }
                    if (section.topics && section.topics.length > 0) {
                        let topicsArray = Array.isArray(section.topics) ? section.topics : section.topics.split(',').map(t => t.trim()).filter(Boolean);
                        if (topicsArray.length > 0) {
                             query.topic = { $in: topicsArray.map(t => new RegExp(`^${t}$`, 'i')) };
                        }
                    }

                    let questions = await Question.find(query);
                    if (questions.length < count) {
                        return res.status(400).json({ msg: `Not enough questions for section "${section.sectionName}". Found ${questions.length}, needed ${count}.` });
                    }

                    // Shuffle
                    const fisherYatesShuffle = (arr) => {
                        for (let i = arr.length - 1; i > 0; i--) {
                            const j = Math.floor(Math.random() * (i + 1));
                            [arr[i], arr[j]] = [arr[j], arr[i]];
                        }
                    };
                    fisherYatesShuffle(questions);
                    
                    const picked = questions.slice(0, count);
                    const pickedIds = picked.map(q => q._id);
                    selectedQuestions.push(...pickedIds);
                    sectionedQuestions.push({
                        sectionName: section.sectionName,
                        questions: pickedIds
                    });
                    totalCalculatedMarks += (count * marks);
                }
            }
            if (calculatedDuration === 0) calculatedDuration = duration || 180;
        } else if (marksDistribution && Object.keys(marksDistribution).length > 0) {
            calculatedDuration = duration;
            for (const [type, info] of Object.entries(marksDistribution)) {
                const count = parseInt(info.count);
                const marks = parseInt(info.marks);

                if (count > 0) {
                    let query = { user: req.user.id, subject: subject, type: type, status: 'active' };
                    if (difficulty && difficulty !== 'All') {
                        query.difficulty = difficulty;
                    }

                    let questions = await Question.find(query);
                    if (questions.length < count) {
                        return res.status(400).json({ msg: `Not enough ${type} questions. You have ${questions.length} but need ${count}` });
                    }

                    let easyQs = questions.filter(q => q.difficulty === 'Easy');
                    let mediumQs = questions.filter(q => q.difficulty === 'Medium');
                    let hardQs = questions.filter(q => q.difficulty === 'Hard');
                    let uncategorizedQs = questions.filter(q => !['Easy', 'Medium', 'Hard'].includes(q.difficulty));
                    mediumQs.push(...uncategorizedQs);

                    const fisherYatesShuffle = (arr) => {
                        for (let i = arr.length - 1; i > 0; i--) {
                            const j = Math.floor(Math.random() * (i + 1));
                            [arr[i], arr[j]] = [arr[j], arr[i]];
                        }
                    };

                    fisherYatesShuffle(easyQs);
                    fisherYatesShuffle(mediumQs);
                    fisherYatesShuffle(hardQs);

                    let targetEasy = Math.round(count * 0.3);
                    let targetHard = Math.round(count * 0.2);
                    let targetMedium = count - targetEasy - targetHard;

                    let pickedForType = [];

                    const pick = (source, num) => {
                        const picked = source.splice(0, num);
                        pickedForType.push(...picked);
                        return num - picked.length;
                    };

                    let easyDeficit = pick(easyQs, targetEasy);
                    let mediumDeficit = pick(mediumQs, targetMedium);
                    let hardDeficit = pick(hardQs, targetHard);

                    let totalDeficit = easyDeficit + mediumDeficit + hardDeficit;

                    if (totalDeficit > 0) {
                        let pools = [mediumQs, easyQs, hardQs];
                        for (let pool of pools) {
                            if (totalDeficit === 0) break;
                            totalDeficit = pick(pool, totalDeficit);
                        }
                    }

                    fisherYatesShuffle(pickedForType);

                    const pickedIds = pickedForType.map(q => q._id);
                    selectedQuestions.push(...pickedIds);
                    totalCalculatedMarks += (count * marks);
                }
            }
        } else {
            return res.status(400).json({ msg: "A blueprint or marks distribution is required" });
        }

        if (selectedQuestions.length === 0) {
            return res.status(400).json({ msg: "No questions selected based on the distribution" });
        }

        // Save the Exam paper
        const newExam = new Exam({
            user: req.user.id,
            examTitle,
            description,
            collegeName,
            institutionType,
            department,
            academicSession,
            courseCode,
            logo,
            examHeaderStyle,
            subject,
            topic,
            instructions,
            marksDistribution,
            blueprint,
            examDate,
            duration: calculatedDuration,
            questions: selectedQuestions,
            sectionedQuestions,
            totalMarks: totalCalculatedMarks
        });

        const exam = await newExam.save();
        
        // Update usage count and last used date for selected questions
        await Question.updateMany(
            { _id: { $in: selectedQuestions } },
            { 
                $inc: { usageCount: 1 }, 
                $set: { lastUsedDate: new Date() } 
            }
        );

        // Populate question details before sending to frontend
        const fullExam = await Exam.findById(exam._id).populate('questions').populate('sectionedQuestions.questions');
        res.json(fullExam);

    } catch (err) {
        res.status(500).json({ msg: "Server Error", error: err.message });
    }
};

// Get all exams for the logged-in user
const getExams = async (req, res) => {
    try {
        const exams = await Exam.find({ user: req.user.id })
            .populate('questions')
            .populate('sectionedQuestions.questions')
            .sort({ generatedAt: -1 });
        res.json(exams);
    } catch (err) {
        res.status(500).json({ msg: "Server Error", error: err.message });
    }
};

// Get single exam by ID
const getExam = async (req, res) => {
    try {
        const exam = await Exam.findOne({ 
            _id: req.params.id, 
            user: req.user.id 
        }).populate('questions').populate('sectionedQuestions.questions');
        
        if (!exam) {
            return res.status(404).json({ msg: "Exam not found" });
        }
        
        res.json(exam);
    } catch (err) {
        res.status(500).json({ msg: "Server Error", error: err.message });
    }
};

const generatePDF = async (doc, exam, isAnswerKey) => {
    
    // Attempt to load logo if present
    let logoBuffer = null;
    if (exam.logo) {
        try {
            const response = await axios.get(exam.logo, { responseType: 'arraybuffer' });
            logoBuffer = Buffer.from(response.data, 'binary');
        } catch (e) {
            console.error("Failed to load logo for PDF:", e.message);
        }
    }

    // Header Styles
    const style = exam.examHeaderStyle || 'Style 3';

    if (style === 'Style 1') {
        if (logoBuffer) {
            doc.image(logoBuffer, 50, 40, { fit: [50, 50] });
        }
        doc.fontSize(16).text(exam.collegeName || exam.institutionName || 'INSTITUTION NAME', { align: 'center', underline: false }).moveDown(0.2);
        doc.fontSize(12).text(exam.examTitle + (isAnswerKey ? ' - ANSWER KEY' : ''), { align: 'center' }).moveDown();
        doc.fontSize(10);
        doc.text(`Subject: ${exam.subject || 'N/A'}`, 50, doc.y, { continued: true }).text(`Time: ${exam.duration ? exam.duration + ' mins' : 'N/A'}`, { continued: true, align: 'center' }).text(`Max Marks: ${exam.totalMarks || 0}`, { align: 'right' });
        if (exam.topic) doc.text(`Topic: ${exam.topic}`, 50, doc.y);
        doc.moveDown(0.5);
    } else if (style === 'Style 2') {
        doc.font('Times-Bold').fontSize(20).text(exam.collegeName || exam.institutionName || 'INSTITUTION NAME', { align: 'center' }).moveDown(0.2);
        if (exam.department) {
            doc.font('Times-Italic').fontSize(12).text(`Department of ${exam.department}`, { align: 'center' }).moveDown(0.2);
        }
        doc.font('Helvetica-Bold').fontSize(10).text(exam.academicSession || 'SESSION', { align: 'center' }).moveDown(0.5);
        doc.fontSize(14).text(exam.examTitle + (isAnswerKey ? ' - ANSWER KEY' : ''), { align: 'center' }).moveDown();
        doc.fontSize(10);
        doc.text(`Course: ${exam.courseCode || exam.subject || 'N/A'}`, 50, doc.y, { continued: true }).text(`Time: ${exam.duration ? exam.duration + ' mins' : 'N/A'}`, { align: 'right' });
        if (exam.topic) doc.text(`Topic: ${exam.topic}`, 50, doc.y);
        doc.text(`Maximum Marks: ${exam.totalMarks || 0}`, { align: 'right' });
        doc.moveDown(0.5);
        doc.font('Helvetica');
    } else if (style === 'Style 4') {
        doc.rect(40, 40, 532, 80).stroke(); // Outer box
        if (logoBuffer) {
            doc.image(logoBuffer, 50, 45, { fit: [50, 50] });
        }
        doc.fontSize(16).text(exam.collegeName || exam.institutionName || 'INSTITUTION NAME', 110, 50, { align: 'left' });
        doc.fontSize(12).text(exam.examTitle + (isAnswerKey ? ' - ANSWER KEY' : ''), 110, 70, { align: 'left' });
        
        doc.moveTo(40, 95).lineTo(572, 95).stroke(); // Separator line
        
        doc.fontSize(9).text(`SUBJECT: ${exam.subject}`, 50, 100);
        doc.text(`SESSION: ${exam.academicSession}`, 400, 100);
        doc.text(`TOPIC: ${exam.topic || 'N/A'}`, 50, 110);
        doc.text(`MARKS: ${exam.totalMarks}`, 400, 110);
        doc.text(`TIME: ${exam.duration} MINS`, 50, 120);
        doc.moveDown(3);
    } else {
        // Style 3 (Default)
        if (logoBuffer) {
            doc.image(logoBuffer, 275, 40, { fit: [60, 60], align: 'center' });
            doc.y = 110;
        }
        doc.fontSize(18).text(exam.collegeName || exam.institutionName || 'INSTITUTION NAME', { align: 'center' }).moveDown(0.2);
        doc.fontSize(14).text(exam.examTitle + (isAnswerKey ? ' - ANSWER KEY' : ''), { align: 'center' }).moveDown();
        if (exam.courseCode) {
            doc.fontSize(10).text(`Course: ${exam.courseCode}`, { align: 'center' }).moveDown();
        }
        if (exam.topic) {
            doc.fontSize(10).text(`Topic: ${exam.topic}`, { align: 'center' }).moveDown();
        }
        doc.fontSize(10);
        doc.text(`Time: ${exam.duration ? exam.duration + ' mins' : 'N/A'}`, 50, doc.y, { continued: true }).text(`Total Marks: ${exam.totalMarks || 0}`, { align: 'right' });
        doc.moveDown(0.5);
    }
    
    // Instructions
    if (exam.instructions && !isAnswerKey) {
        doc.fontSize(10).font('Helvetica-Bold').text('Instructions:').font('Helvetica');
        doc.fontSize(10).text(exam.instructions).moveDown();
    }
    
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke().moveDown(1.5);

    // NEW BLOCK: Print Blueprint Table if it exists
    if (exam.blueprint && exam.blueprint.length > 0 && !isAnswerKey) {
        doc.fontSize(12).font('Helvetica-Bold').text('EXAM TEMPLATE & SECTION BREAKDOWN', { align: 'center' }).moveDown(0.5);
        doc.font('Helvetica-Bold').fontSize(10);
        const startY = doc.y;
        doc.text('Section Name', 50, startY);
        doc.text('Type', 170, startY);
        doc.text('Questions', 230, startY);
        doc.text('Marks', 290, startY);
        doc.text('Time', 340, startY);
        doc.text('Topics', 390, startY);
        doc.text('Difficulty', 490, startY);
        doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).stroke().moveDown(1);
        doc.font('Helvetica').fontSize(9);
        
        exam.blueprint.forEach(sec => {
            const y = doc.y;
            doc.text(sec.sectionName, 50, y, { width: 110 });
            doc.text(sec.type || 'MCQ', 170, y);
            doc.text(sec.questionCount ? sec.questionCount.toString() : '0', 230, y);
            doc.text(sec.totalMarks ? sec.totalMarks.toString() : '0', 290, y);
            doc.text(sec.duration ? `${sec.duration}m` : '-', 340, y);
            const topicsText = Array.isArray(sec.topics) ? sec.topics.join(', ') : (sec.topics || '-');
            doc.text(topicsText, 390, y, { width: 90 });
            doc.text(sec.difficulty || 'Mixed', 490, y);
            doc.moveDown(0.5);
        });
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke().moveDown(1.5);
    }
    
    let qNumber = 1;

    // Check if new blueprint architecture
    if (exam.sectionedQuestions && exam.sectionedQuestions.length > 0) {
        for (const section of exam.sectionedQuestions) {
            if (!section.questions || section.questions.length === 0) continue;
            
            const bp = exam.blueprint ? exam.blueprint.find(b => b.sectionName === section.sectionName) : null;
            const marksForType = bp ? bp.marksPerQuestion : 1;
            const type = bp ? (bp.type || 'MCQ') : 'MCQ';
            
            doc.fontSize(12).font('Helvetica-Bold').text(`Section: ${section.sectionName} (${section.questions.length} Questions, ${marksForType} mark${marksForType > 1 ? 's' : ''} each)`, { underline: true }).moveDown(0.5);
            doc.font('Helvetica');
            
            section.questions.forEach(q => {
                doc.fontSize(11).text(`Q${qNumber}. ${q.questionText}`);
                if (!isAnswerKey) {
                    if (type === 'MCQ' && q.options && q.options.length > 0) {
                        const letters = ['A', 'B', 'C', 'D', 'E'];
                        q.options.forEach((opt, idx) => {
                            doc.text(`   ${letters[idx] || '-'}. ${opt}`);
                        });
                    } else if (type === 'True/False') {
                        doc.text(`   A. True`);
                        doc.text(`   B. False`);
                    } else if (type === 'Short Answer') {
                        doc.moveDown(2);
                    } else if (type === 'Long Answer' || type === 'Coding') {
                        doc.moveDown(5);
                    }
                } else {
                    doc.fillColor('green').text(`   Answer: ${q.correctAnswer || 'N/A'}`).fillColor('black');
                }
                doc.moveDown(0.5);
                qNumber++;
            });
            doc.moveDown();
        }
    } else {
        // Questions grouped by type (legacy)
    // We'll iterate through all questions and list them
    const questionsByType = {
        'MCQ': [],
        'Short Answer': [],
        'Long Answer': [],
        'True/False': []
    };
    
    exam.questions.forEach(q => {
        if (questionsByType[q.type]) {
            questionsByType[q.type].push(q);
        } else {
            questionsByType['MCQ'].push(q); // default
        }
    });

    let qNumber = 1;
    for (const [type, qList] of Object.entries(questionsByType)) {
        if (qList.length === 0) continue;
        
        const marksForType = exam.marksDistribution?.[type]?.marks || 1;
        
        doc.fontSize(12).text(`Section: ${type} (${qList.length} Questions, ${marksForType} mark${marksForType > 1 ? 's' : ''} each)`, { underline: true }).moveDown(0.5);
        
        qList.forEach(q => {
            doc.fontSize(11).text(`Q${qNumber}. ${q.questionText}`);
            
            if (!isAnswerKey) {
                if (type === 'MCQ' && q.options && q.options.length > 0) {
                    const letters = ['A', 'B', 'C', 'D', 'E'];
                    q.options.forEach((opt, idx) => {
                        doc.text(`   ${letters[idx] || '-'}. ${opt}`);
                    });
                } else if (type === 'True/False') {
                    doc.text(`   A. True`);
                    doc.text(`   B. False`);
                } else if (type === 'Short Answer') {
                    doc.moveDown(2); // Leave some space for answer
                } else if (type === 'Long Answer') {
                    doc.moveDown(5); // Leave more space for answer
                }
            } else {
                // For Answer Key, print the correct answer
                doc.fillColor('green').text(`   Answer: ${q.correctAnswer || 'N/A'}`).fillColor('black');
            }
            doc.moveDown(0.5);
            qNumber++;
        });
        doc.moveDown();
    }
};

// Download exam PDF
const downloadExamPDF = async (req, res) => {
    try {
        const exam = await Exam.findOne({ _id: req.params.id, user: req.user.id }).populate('questions').populate('sectionedQuestions.questions');
        if (!exam) return res.status(404).json({ msg: "Exam not found" });

        const doc = new PDFDocument({ margin: 50 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Exam-${exam._id}.pdf`);
        doc.pipe(res);

        await generatePDF(doc, exam, false);

        doc.end();
    } catch (err) {
        console.error("PDF generation error:", err);
        if (!res.headersSent) {
            res.status(500).json({ msg: "Server Error generating PDF", error: err.message });
        }
    }
};

// Download answer key PDF
const downloadAnswerKeyPDF = async (req, res) => {
    try {
        const exam = await Exam.findOne({ _id: req.params.id, user: req.user.id }).populate('questions').populate('sectionedQuestions.questions');
        if (!exam) return res.status(404).json({ msg: "Exam not found" });

        const doc = new PDFDocument({ margin: 50 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=AnswerKey-${exam._id}.pdf`);
        doc.pipe(res);

        await generatePDF(doc, exam, true);

        doc.end();
    } catch (err) {
        console.error("PDF generation error:", err);
        if (!res.headersSent) {
            res.status(500).json({ msg: "Server Error generating PDF", error: err.message });
        }
    }
};

// Delete an exam
const deleteExam = async (req, res) => {
    try {
        const exam = await Exam.findOne({ _id: req.params.id, user: req.user.id });
        if (!exam) return res.status(404).json({ success: false, msg: "Exam not found" });

        await Exam.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Exam deleted successfully" });
    } catch (err) {
        res.status(500).json({ success: false, msg: "Server Error", error: err.message });
    }
};

// Bulk delete exams
const bulkDeleteExams = async (req, res) => {
    try {
        const { examIds } = req.body;
        if (!examIds || !Array.isArray(examIds)) {
            return res.status(400).json({ success: false, msg: "Invalid array of exam IDs" });
        }

        await Exam.deleteMany({
            _id: { $in: examIds },
            user: req.user.id
        });

        res.json({ success: true, message: "Exams deleted successfully" });
    } catch (err) {
        res.status(500).json({ success: false, msg: "Server Error", error: err.message });
    }
};

export { generateExam, getExams, getExam, downloadExamPDF, downloadAnswerKeyPDF, deleteExam, bulkDeleteExams };