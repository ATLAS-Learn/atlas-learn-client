import { AssessmentQuestion } from "@/services/types";

// 5 initial assessment questions covering A-level Computer Science syllabus
export const ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
    {
        id: "assess-1",
        question: "What is the time complexity of binary search on a sorted array?",
        options: [
            "O(n)",
            "O(log n)",
            "O(n log n)",
            "O(1)",
        ],
        correctAnswer: 1,
        topic: "Algorithms",
    },
    {
        id: "assess-2",
        question: "Which data structure follows the LIFO (Last In First Out) principle?",
        options: [
            "Queue",
            "Stack",
            "Linked List",
            "Tree",
        ],
        correctAnswer: 1,
        topic: "Data Structures",
    },
    {
        id: "assess-3",
        question: "What does SQL stand for?",
        options: [
            "Structured Query Language",
            "Simple Query Language",
            "Standard Query Language",
            "System Query Language",
        ],
        correctAnswer: 0,
        topic: "Databases",
    },
    {
        id: "assess-4",
        question: "In object-oriented programming, what is encapsulation?",
        options: [
            "Hiding internal details and showing only essential features",
            "Creating multiple instances of a class",
            "Inheriting properties from a parent class",
            "Combining multiple classes into one",
        ],
        correctAnswer: 0,
        topic: "Object-Oriented Programming",
    },
    {
        id: "assess-5",
        question: "What is the purpose of a compiler?",
        options: [
            "To execute code line by line",
            "To translate high-level code into machine code",
            "To debug code",
            "To format code",
        ],
        correctAnswer: 1,
        topic: "Programming Fundamentals",
    },
];

