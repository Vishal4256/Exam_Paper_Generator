import Exam from '../models/Exam.model.js';
import Question from '../models/Question.model.js';
import PDFDocument from 'pdfkit';
import axios from 'axios';

const generateExam = async (req, res) => {
    try {
        const { examMode, examTitle, description, collegeName, institutionType, department, academicSession, courseCode, logo, examHeaderStyle, subject, topic, examDate, duration, instructions, marksDistribution, blueprint, difficulty } = req.body;

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
                    let sectionSubject = subject;
                    if (examMode === 'Multi Subject') {
                        sectionSubject = section.subject || section.sectionName;
                    }
                    let query = { user: req.user.id, subject: sectionSubject, type: sectionType, status: 'active' };
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
            examMode: examMode || 'Single Subject',
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
    // Layout Constants
    const topMargin = 57; // ~20mm
    const bottomMargin = 57; // ~20mm
    const sideMargin = 43; // ~15mm
    
    const innerWidth = doc.page.width - sideMargin * 2;
    const col1 = innerWidth * 0.10;
    const col2 = innerWidth * 0.75;
    const col3 = innerWidth * 0.15;
    const x1 = sideMargin;
    const x2 = x1 + col1;
    const x3 = x2 + col2;
    const x4 = x3 + col3;

    // Add page numbering footer listener
    let pageNumber = 1;
    doc.on('pageAdded', () => {
        pageNumber++;
        const oldBottom = doc.page.margins.bottom;
        doc.page.margins.bottom = 0; 
        
        doc.font('Times-Roman').fontSize(8).text(`${pageNumber}`, 
            doc.page.margins.left, 
            doc.page.height - 40, 
            { align: 'center', width: innerWidth, lineBreak: false }
        );
        doc.font('Times-Roman').fontSize(8).text(`Developed by: ExamFlow`, 
            doc.page.margins.left, 
            doc.page.height - 25, 
            { align: 'center', width: innerWidth, lineBreak: false }
        );
        
        doc.page.margins.bottom = oldBottom; 
        doc.y = doc.page.margins.top; 
    });

    // Write page 1 footer manually initially
    const oldBottom = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    let oldY = doc.y;
    doc.font('Times-Roman').fontSize(8).text(`1`, 
        doc.page.margins.left, 
        doc.page.height - 40, 
        { align: 'center', width: innerWidth, lineBreak: false }
    );
    doc.font('Times-Roman').fontSize(8).text(`Developed by: ExamFlow`, 
        doc.page.margins.left, 
        doc.page.height - 25, 
        { align: 'center', width: innerWidth, lineBreak: false }
    );
    doc.page.margins.bottom = oldBottom;
    doc.y = oldY;

    // Header Block
    doc.font('Times-Bold').fontSize(14).text((exam.collegeName || exam.institutionName || 'INSTITUTION NAME').toUpperCase(), { align: 'center' }).moveDown(0.2);
    
    const displaySubject = exam.examMode === 'Multi Subject' ? 'MULTIPLE SUBJECTS' : (exam.subject || 'N/A').toUpperCase();
    doc.fontSize(13).text(displaySubject, { align: 'center' }).moveDown(0.2);
    
    if (exam.courseCode) {
        doc.font('Times-Roman').fontSize(10).text(`Class: ${exam.courseCode}`, { align: 'center' }).moveDown(0.2);
    }
    
    doc.font('Times-Bold').fontSize(11).text(exam.examTitle.toUpperCase() + (isAnswerKey ? ' - ANSWER KEY' : ''), { align: 'center' }).moveDown(0.5);
    
    // Time & Marks row
    doc.moveTo(sideMargin, doc.y).lineTo(sideMargin + innerWidth, doc.y).lineWidth(0.5).stroke().moveDown(0.5);
    doc.font('Times-Bold').fontSize(10);
    doc.text(`TIME: ${exam.duration ? exam.duration + ' HOURS' : 'N/A'}`, sideMargin, doc.y, { continued: true }).text(`M.M.: ${exam.totalMarks || 0}`, { align: 'right' });
    doc.moveDown(0.5);
    doc.moveTo(sideMargin, doc.y).lineTo(sideMargin + innerWidth, doc.y).stroke().moveDown(1);
    
    // General Instructions
    doc.font('Times-Bold').fontSize(9).text('General Instructions:');
    doc.font('Times-Roman').fontSize(9).text(exam.instructions || '• All questions are compulsory.\n• Read questions carefully before answering.', { lineGap: 3 }).moveDown(1.5);
    
    let qNumber = 1;

    const drawTableHeader = () => {
        const h = 20;
        doc.font('Times-Bold').fontSize(9);
        const startY = doc.y;
        doc.text('Q.NO.', x1, startY + 6, { width: col1, align: 'center' });
        doc.text('QUESTIONS', x2, startY + 6, { width: col2, align: 'center' });
        doc.text('MARKS', x3, startY + 6, { width: col3, align: 'center' });
        
        doc.lineWidth(0.5);
        doc.rect(x1, startY, innerWidth, h).stroke();
        doc.moveTo(x2, startY).lineTo(x2, startY + h).stroke();
        doc.moveTo(x3, startY).lineTo(x3, startY + h).stroke();
        doc.y = startY + h;
    };

    const drawBorders = (startY, height) => {
        doc.lineWidth(0.5);
        doc.rect(x1, startY, innerWidth, height).stroke();
        doc.moveTo(x2, startY).lineTo(x2, startY + height).stroke();
        doc.moveTo(x3, startY).lineTo(x3, startY + height).stroke();
    };

    const checkPageBreak = (requiredHeight) => {
        if (doc.y + requiredHeight > doc.page.height - bottomMargin - 10) {
            doc.addPage();
            drawTableHeader();
            return true;
        }
        return false;
    };

    drawTableHeader();

    const processSection = (qList, sectionName, type, marksForType) => {
        // Section Header (Merged Row)
        const secTitle = `${sectionName} (${type.toUpperCase()})`;
        const secSub = `Questions carry ${marksForType} mark${marksForType > 1 ? 's' : ''}`;
        
        let secHeight = doc.heightOfString(secTitle, { font: 'Times-Bold', fontSize: 10, width: innerWidth }) + 
                        doc.heightOfString(secSub, { font: 'Times-Roman', fontSize: 9, width: innerWidth }) + 15;
        
        checkPageBreak(secHeight);
        
        let startY = doc.y;
        doc.font('Times-Bold').fontSize(10).text(secTitle, x1, startY + 5, { width: innerWidth, align: 'center' });
        doc.font('Times-Roman').fontSize(9).text(secSub, x1, doc.y + 2, { width: innerWidth, align: 'center' });
        
        doc.lineWidth(0.5);
        doc.rect(x1, startY, innerWidth, secHeight).stroke();
        doc.y = startY + secHeight;

        // Questions
        qList.forEach(q => {
            // Calculate height needed
            doc.font('Times-Roman').fontSize(10);
            const qTextWidth = col2 - 10;
            let reqHeight = 10; // top padding
            
            reqHeight += doc.heightOfString(q.questionText, { width: qTextWidth, lineGap: 2 });
            
            if (!isAnswerKey) {
                if (type === 'MCQ' && q.options && q.options.length > 0) {
                    reqHeight += 5;
                    const letters = ['A.', 'B.', 'C.', 'D.', 'E.'];
                    q.options.forEach((opt, idx) => {
                        reqHeight += doc.heightOfString(`${letters[idx] || '-'} ${opt}`, { width: qTextWidth - 15, lineGap: 2 }) + 4;
                    });
                } else if (type === 'True/False') {
                    reqHeight += 35;
                } else if (type === 'Short Answer') {
                    reqHeight += 35;
                } else if (type === 'Long Answer' || type === 'Coding') {
                    reqHeight += 70;
                }
            } else {
                reqHeight += 15; // correct answer height
            }
            
            // Metadata height
            reqHeight += 15; 
            reqHeight += 5; // bottom padding
            
            // Minimum height check for text
            const minH = Math.max(reqHeight, 30);
            
            checkPageBreak(minH);
            
            let rowStartY = doc.y;
            
            // Q.NO.
            doc.font('Times-Bold').fontSize(10).text(`${qNumber}`, x1, rowStartY + 10, { width: col1, align: 'center' });
            
            // MARKS
            doc.text(`${marksForType}`, x3, rowStartY + 10, { width: col3, align: 'center' });
            
            // QUESTION BODY
            let currentY = rowStartY + 10;
            doc.font('Times-Roman').text(q.questionText, x2 + 5, currentY, { width: qTextWidth, lineGap: 2 });
            currentY = doc.y + 5;
            
            if (!isAnswerKey) {
                if (type === 'MCQ' && q.options && q.options.length > 0) {
                    const letters = ['A.', 'B.', 'C.', 'D.', 'E.'];
                    q.options.forEach((opt, idx) => {
                        doc.text(`${letters[idx] || '-'} ${opt}`, x2 + 15, currentY, { width: qTextWidth - 15, lineGap: 2 });
                        currentY = doc.y + 4;
                    });
                } else if (type === 'True/False') {
                    doc.text(`A. True`, x2 + 15, currentY);
                    currentY += 15;
                    doc.text(`B. False`, x2 + 15, currentY);
                    currentY += 20;
                } else if (type === 'Short Answer') {
                    currentY += 35;
                } else if (type === 'Long Answer' || type === 'Coding') {
                    currentY += 70;
                }
            } else {
                doc.fillColor('green').text(`Correct Answer: ${q.correctAnswer || 'N/A'}`, x2 + 5, currentY).fillColor('black');
                currentY = doc.y + 10;
            }
            
            // Metadata
            const diff = q.difficultyLevel || 'Medium';
            doc.font('Times-Roman').fillColor('gray').fontSize(7).text(`Difficulty: ${diff}`, x2 + 5, currentY, { align: 'right', width: qTextWidth - 5 });
            doc.fillColor('black');
            
            // Draw row borders
            const finalHeight = (currentY + 15) - rowStartY;
            drawBorders(rowStartY, finalHeight);
            
            doc.y = rowStartY + finalHeight;
            qNumber++;
        });
    };

    if (exam.sectionedQuestions && exam.sectionedQuestions.length > 0) {
        let sIdx = 0;
        for (const section of exam.sectionedQuestions) {
            if (!section.questions || section.questions.length === 0) continue;
            const bp = exam.blueprint ? exam.blueprint.find(b => b.sectionName === section.sectionName) : null;
            const marksForType = bp ? bp.marksPerQuestion : 1;
            const type = bp ? (bp.type || 'MCQ') : 'MCQ';
            processSection(section.questions, section.sectionName.toUpperCase(), type, marksForType);
            sIdx++;
        }
    } else {
        const questionsByType = { 'MCQ': [], 'Short Answer': [], 'Long Answer': [], 'True/False': [] };
        exam.questions.forEach(q => {
            if (questionsByType[q.type]) questionsByType[q.type].push(q);
            else questionsByType['MCQ'].push(q);
        });

        let sIdx = 0;
        for (const [type, qList] of Object.entries(questionsByType)) {
            if (qList.length === 0) continue;
            const marksForType = exam.marksDistribution?.[type]?.marks || 1;
            processSection(qList, `SECTION ${String.fromCharCode(65 + sIdx)}`, type, marksForType);
            sIdx++;
        }
    }
};

// Download exam PDF
const downloadExamPDF = async (req, res) => {
    try {
        const exam = await Exam.findOne({ _id: req.params.id, user: req.user.id }).populate('questions').populate('sectionedQuestions.questions');
        if (!exam) return res.status(404).json({ msg: "Exam not found" });

        const doc = new PDFDocument({ 
            size: 'A4', 
            margins: { top: 57, bottom: 57, left: 43, right: 43 },
            autoFirstPage: true
        });
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

        const doc = new PDFDocument({ 
            size: 'A4', 
            margins: { top: 57, bottom: 57, left: 43, right: 43 },
            autoFirstPage: true
        });
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