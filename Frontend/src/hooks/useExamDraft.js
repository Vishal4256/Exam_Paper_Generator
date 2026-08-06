import { useState, useEffect, useRef, useCallback } from 'react';

const DRAFT_KEY = 'exam_draft';

// Helper for deep comparison
const isEqual = (obj1, obj2) => {
    if (obj1 === obj2) return true;
    if (typeof obj1 !== 'object' || obj1 === null || typeof obj2 !== 'object' || obj2 === null) {
        return false;
    }
    
    // Handle arrays
    if (Array.isArray(obj1) && Array.isArray(obj2)) {
        if (obj1.length !== obj2.length) return false;
        for (let i = 0; i < obj1.length; i++) {
            if (!isEqual(obj1[i], obj2[i])) return false;
        }
        return true;
    }
    
    // Handle objects
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    if (keys1.length !== keys2.length) return false;
    for (let key of keys1) {
        if (!keys2.includes(key) || !isEqual(obj1[key], obj2[key])) return false;
    }
    return true;
};

const defaultState = {
    currentStep: 1,
    institutionName: '',
    examTitle: '',
    department: '',
    courseCode: '',
    selectedSubject: '',
    duration: 180,
    totalMarks: 100,
    selectedTopics: {},
    blueprint: [],
    
    // Maintained for backend compatibility
    examMode: 'Single Subject',
    institutionType: 'School',
    academicSession: '',
    logo: '',
    examHeaderStyle: 'Style 3',
    instructions: '',
    examDate: ''
};

export const isDraftMeaningful = (draft) => {
    if (!draft) return false;
    return !!(
        draft.institutionName || 
        draft.examTitle || 
        draft.department ||
        draft.courseCode ||
        draft.selectedSubject || 
        draft.instructions ||
        (draft.duration && draft.duration !== 180) ||
        (draft.selectedTopics && Object.keys(draft.selectedTopics).length > 0) ||
        (draft.blueprint && draft.blueprint.length > 0)
    );
};

const loadDraftInternal = () => {
    const stored = localStorage.getItem(DRAFT_KEY);
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (err) {}
    }
    return null;
};

export const useExamDraft = () => {
    const initialParsed = loadDraftInternal();
    // Handle backward compatibility: if it doesn't have the 'draft' wrapper, treat the whole object as the draft
    const actualDraft = initialParsed ? (initialParsed.draft || initialParsed) : null;
    const isAutoRestore = actualDraft && isDraftMeaningful(actualDraft) && initialParsed?.hasBeenResumed;

    const [draftData, setDraftData] = useState(() => {
        if (isAutoRestore) {
            const { _timestamp, ...cleanData } = actualDraft;
            return cleanData;
        }
        return defaultState;
    });

    const [lastSavedTime, setLastSavedTime] = useState(() => {
        if (isAutoRestore && initialParsed?.draftUpdatedAt) {
            return new Date(initialParsed.draftUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        return null;
    });
    
    const [isSaving, setIsSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    
    const [hasExistingDraft, setHasExistingDraft] = useState(() => {
        if (isAutoRestore) return false;
        if (actualDraft && isDraftMeaningful(actualDraft) && !initialParsed?.hasBeenResumed) {
            return true;
        }
        return false;
    });
    
    // Guard against auto-saves overwriting the draft before the user decides
    const hasExistingDraftRef = useRef(hasExistingDraft);
    // Keep ref in sync
    useEffect(() => {
        hasExistingDraftRef.current = hasExistingDraft;
    }, [hasExistingDraft]);

    // Refs to track previous states for comparison and debouncing
    const draftDataRef = useRef(draftData);
    const savedDataRef = useRef(draftData);
    const debounceTimerRef = useRef(null);
    const saveFeedbackTimerRef = useRef(null);

    const updateDraft = useCallback((updates, isInit = false) => {
        if (hasExistingDraftRef.current) {
            return;
        }
        
        setDraftData(prev => {
            const next = { ...prev, ...updates };
            draftDataRef.current = next;
            
            if (isInit) {
                savedDataRef.current = next;
            } else if (!isEqual(next, savedDataRef.current)) {
                setHasUnsavedChanges(true);
            }
            
            return next;
        });
    }, []);

    const saveDraft = useCallback((force = false, markResumed = false) => {
        if (hasExistingDraftRef.current && !force && !markResumed) {
            return;
        }

        const currentData = draftDataRef.current;
        if (!force && !markResumed && isEqual(currentData, savedDataRef.current)) {
            setHasUnsavedChanges(false);
            setIsSaving(false);
            return;
        }

        if (!isDraftMeaningful(currentData)) {
            return; // Don't save empty states as drafts
        }

        setIsSaving(true);
        try {
            const existingMetadata = loadDraftInternal() || {};
            const isLegacy = !existingMetadata.draftId;
            
            const metadata = {
                draft: currentData,
                draftId: existingMetadata.draftId || crypto.randomUUID(),
                draftCreatedAt: existingMetadata.draftCreatedAt || new Date().toISOString(),
                draftUpdatedAt: new Date().toISOString(),
                hasBeenResumed: markResumed ? true : (existingMetadata.hasBeenResumed || false)
            };

            localStorage.setItem(DRAFT_KEY, JSON.stringify(metadata));
            
            savedDataRef.current = currentData;
            setLastSavedTime(new Date(metadata.draftUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            setHasUnsavedChanges(false);
        } catch (err) {
            console.error('Failed to save draft:', err);
        } finally {
            if (saveFeedbackTimerRef.current) clearTimeout(saveFeedbackTimerRef.current);
            saveFeedbackTimerRef.current = setTimeout(() => {
                setIsSaving(false);
            }, 500);
        }
    }, []);

    // Debounced Autosave
    useEffect(() => {
        if (!hasUnsavedChanges) return;

        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        
        setIsSaving(true);
        debounceTimerRef.current = setTimeout(() => {
            saveDraft();
        }, 500);

        return () => {
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        };
    }, [draftData, hasUnsavedChanges, saveDraft]);

    // Save on unmount if unsaved changes exist
    useEffect(() => {
        return () => {
            // Because React closures trap values, we use the refs to determine if a save is needed
            const currentData = draftDataRef.current;
            const savedData = savedDataRef.current;
            
            if (!isEqual(currentData, savedData) && isDraftMeaningful(currentData)) {
                const existingMetadata = loadDraftInternal() || {};
                const metadata = {
                    draft: currentData,
                    draftId: existingMetadata.draftId || crypto.randomUUID(),
                    draftCreatedAt: existingMetadata.draftCreatedAt || new Date().toISOString(),
                    draftUpdatedAt: new Date().toISOString(),
                    hasBeenResumed: existingMetadata.hasBeenResumed || false
                };
                localStorage.setItem(DRAFT_KEY, JSON.stringify(metadata));
            }
            if (saveFeedbackTimerRef.current) clearTimeout(saveFeedbackTimerRef.current);
        };
    }, []);

    const loadDraft = useCallback(() => {
        return loadDraftInternal();
    }, []);

    const restoreDraft = useCallback(() => {
        const parsed = loadDraftInternal();
        
        const actual = parsed ? (parsed.draft || parsed) : null;
        if (actual && isDraftMeaningful(actual)) {
            const { _timestamp, ...data } = actual;
            setDraftData(data);
            draftDataRef.current = data;
            savedDataRef.current = data;
            
            // Immediately mark as resumed
            saveDraft(true, true);
            
            setHasUnsavedChanges(false);
            setHasExistingDraft(false);
            hasExistingDraftRef.current = false;
            return true;
        }
        return false;
    }, [saveDraft]);

    const markDraftAsResumed = useCallback(() => {
        saveDraft(true, true);
    }, [saveDraft]);

    const clearDraft = useCallback(() => {
        localStorage.removeItem(DRAFT_KEY);
        setDraftData(defaultState);
        draftDataRef.current = defaultState;
        savedDataRef.current = defaultState;
        setLastSavedTime(null);
        setHasUnsavedChanges(false);
        setHasExistingDraft(false);
        hasExistingDraftRef.current = false;
    }, []);

    return {
        draftData,
        updateDraft,
        saveDraft,
        loadDraft,
        restoreDraft,
        clearDraft,
        markDraftAsResumed,
        lastSavedTime,
        isSaving,
        hasUnsavedChanges,
        hasExistingDraft
    };
};
