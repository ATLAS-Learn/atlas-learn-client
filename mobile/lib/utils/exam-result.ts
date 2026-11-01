export const getOrderedCorrections = (result: any) => {
    const corrections = Array.isArray(result?.corrections) ? result.corrections : [];
    const questions = Array.isArray(result?.exam?.questions) ? result.exam.questions : [];
    if (!questions.length) return corrections.map(normalizeCorrection);

    const byQuestionId = new Map(
        corrections
            .filter((correction: any) => correction?.questionId)
            .map((correction: any) => [correction.questionId, correction]),
    );

    return questions
        .map((question: any, index: number) => {
            const correction = byQuestionId.get(question.id) || corrections[index];
            return correction
                ? normalizeCorrection({
                    ...correction,
                    questionId: correction.questionId || question.id,
                    questionText: correction.questionText || question.questionText,
                    questionType: correction.questionType || question.questionType,
                })
                : null;
        })
        .filter(Boolean);
};

const normalizeBoolean = (value: any): boolean | null => {
    if (value === true || value === "true" || value === 1 || value === "1") return true;
    if (value === false || value === "false" || value === 0 || value === "0") return false;
    return null;
};

const normalizeCorrection = (correction: any) => {
    const isCorrect = normalizeBoolean(correction?.isCorrect) ?? correction?.isCorrect ?? null;

    return {
        ...correction,
        questionType: correction?.questionType ? String(correction.questionType) : correction?.questionType,
        isCorrect,
        studentAnswer: correction?.studentAnswer == null ? correction?.studentAnswer : Number(correction.studentAnswer),
        correctAnswerIndex: correction?.correctAnswerIndex == null
            ? correction?.correctAnswerIndex
            : Number(correction.correctAnswerIndex),
        earnedPoints: correction?.earnedPoints == null ? correction?.earnedPoints : Number(correction.earnedPoints),
        points: correction?.points == null ? correction?.points : Number(correction.points),
    };
};

export const isCorrectionGraded = (correction: any) =>
    correction?.isCorrect === true ||
    correction?.isCorrect === false ||
    correction?.isGraded === true ||
    correction?.graded === true ||
    correction?.isCorrected === true ||
    correction?.corrected === true ||
    correction?.pointsAwarded !== undefined ||
    correction?.awardedPoints !== undefined ||
    correction?.scoreAwarded !== undefined ||
    correction?.gradedAt != null;

export const isExamResultCorrected = (result: any, corrections: any[]) => {
    if (result?.isCorrected === true) return true;
    if (result?.isCorrected === false) return false;

    const structuralCorrections = corrections.filter(
        (correction: any) => correction.questionType === "STRUCTURAL",
    );
    if (structuralCorrections.length === 0) return true;
    return structuralCorrections.every(isCorrectionGraded);
};

export const isMcqCorrect = (correction: any) =>
    correction?.isCorrect === true ||
    (
        correction?.earnedPoints != null &&
        correction?.points != null &&
        Number(correction.earnedPoints) >= Number(correction.points) &&
        Number(correction.points) > 0
    );

export type CorrectionStatus = "correct" | "partial" | "incorrect" | "pending";

export const getCorrectionStatus = (correction: any): CorrectionStatus => {
    const isCorrect = normalizeBoolean(correction?.isCorrect);
    const earned =
        correction?.earnedPoints == null ? null : Number(correction.earnedPoints);
    const points =
        correction?.points == null ? null : Number(correction.points);

    if (isCorrect === true) return "correct";

    if (earned != null && points != null && points > 0) {
        if (earned >= points) return "correct";
        if (earned > 0) return "partial";
        return "incorrect";
    }

    if (isCorrect === false) return "incorrect";
    if (isCorrectionGraded(correction) && earned != null) {
        if (earned > 0) return "partial";
        return "incorrect";
    }

    return "pending";
};
