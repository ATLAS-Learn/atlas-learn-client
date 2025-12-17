import { QuizQuestion } from "@/services/types";

// Quiz questions for each chapter
export const QUIZ_QUESTIONS: Record<string, QuizQuestion[]> = {
    "chapter-1": [
        {
            id: "quiz-1-1",
            question: "What is a variable in programming?",
            options: [
                "A container that stores data values",
                "A type of loop",
                "A function",
                "A data structure",
            ],
            correctAnswer: 0,
            explanation: "A variable is a container that stores data values. It allows us to store and manipulate data in our programs.",
        },
        {
            id: "quiz-1-2",
            question: "Which of the following is NOT a common data type?",
            options: [
                "Integer",
                "String",
                "Boolean",
                "Loop",
            ],
            correctAnswer: 3,
            explanation: "Loop is a control structure, not a data type. Common data types include Integer, String, Boolean, and Float.",
        },
        {
            id: "quiz-1-3",
            question: "What does a conditional statement (if/else) do?",
            options: [
                "Repeats code multiple times",
                "Executes code based on conditions",
                "Stores data values",
                "Defines a function",
            ],
            correctAnswer: 1,
            explanation: "Conditional statements execute code based on whether certain conditions are true or false.",
        },
        {
            id: "quiz-1-4",
            question: "What is the purpose of a function?",
            options: [
                "To store variables",
                "To create reusable blocks of code",
                "To display output",
                "To define data types",
            ],
            correctAnswer: 1,
            explanation: "Functions are reusable blocks of code that perform specific tasks, making our code more organized and efficient.",
        },
        {
            id: "quiz-1-5",
            question: "Which data type is used to store text?",
            options: [
                "Integer",
                "Float",
                "String",
                "Boolean",
            ],
            correctAnswer: 2,
            explanation: "Strings are used to store text data, such as names, messages, or any sequence of characters.",
        },
    ],
    "chapter-2": [
        {
            id: "quiz-2-1",
            question: "What is the main difference between an array and a list?",
            options: [
                "Arrays are faster",
                "Arrays have fixed size, lists are dynamic",
                "Lists can only store numbers",
                "There is no difference",
            ],
            correctAnswer: 1,
            explanation: "Arrays have a fixed size determined at creation, while lists can grow or shrink dynamically as needed.",
        },
        {
            id: "quiz-2-2",
            question: "What does LIFO stand for in the context of stacks?",
            options: [
                "Last In First Out",
                "First In First Out",
                "Last In Last Out",
                "First In Last Out",
            ],
            correctAnswer: 0,
            explanation: "LIFO (Last In First Out) means the last element added to the stack is the first one to be removed.",
        },
        {
            id: "quiz-2-3",
            question: "What is the time complexity of linear search?",
            options: [
                "O(1)",
                "O(log n)",
                "O(n)",
                "O(n²)",
            ],
            correctAnswer: 2,
            explanation: "Linear search has O(n) time complexity because in the worst case, we need to check every element.",
        },
        {
            id: "quiz-2-4",
            question: "Binary search requires the data to be:",
            options: [
                "Unsorted",
                "Sorted",
                "In reverse order",
                "Randomly ordered",
            ],
            correctAnswer: 1,
            explanation: "Binary search requires sorted data because it uses a divide-and-conquer approach that relies on comparing values.",
        },
        {
            id: "quiz-2-5",
            question: "What is the average time complexity of Quick Sort?",
            options: [
                "O(n)",
                "O(n log n)",
                "O(n²)",
                "O(log n)",
            ],
            correctAnswer: 1,
            explanation: "Quick Sort has an average time complexity of O(n log n), making it efficient for large datasets.",
        },
    ],
};

// Past paper references for quiz success messages
export const PAST_PAPER_REFERENCES: Record<string, string> = {
    "chapter-1": "9708/12, Q3",
    "chapter-2": "9708/11, Q7",
};

