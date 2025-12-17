import { Chapter, Level } from "@/services/types";

// Initial chapters for Computer Science A-level
export const CHAPTERS: Chapter[] = [
    {
        id: "chapter-1",
        title: "Introduction to Programming",
        description: "Learn the fundamentals of programming, including variables, data types, and basic control structures.",
        level: Level.FOUNDATIONAL,
        order: 1,
        subject: "Computer Science",
        estimatedTime: 30,
        content: [
            {
                id: "section-1-1",
                title: "What is Programming?",
                content: "Programming is the process of creating a set of instructions that tell a computer how to perform a task. These instructions are written in a programming language that the computer can understand and execute.\n\nProgramming allows us to solve problems, automate tasks, and create software applications that make our lives easier.",
                order: 1,
            },
            {
                id: "section-1-2",
                title: "Variables and Data Types",
                content: "Variables are containers that store data values. In programming, we use variables to hold information that can be used and changed throughout our program.\n\nCommon data types include:\n• Integer: Whole numbers (e.g., 5, -10, 100)\n• Float: Decimal numbers (e.g., 3.14, -0.5)\n• String: Text (e.g., 'Hello', 'World')\n• Boolean: True or False values",
                order: 2,
            },
            {
                id: "section-1-3",
                title: "Control Structures",
                content: "Control structures allow us to control the flow of execution in our programs.\n\n• Conditional statements (if/else): Execute code based on conditions\n• Loops (for/while): Repeat code multiple times\n• Functions: Reusable blocks of code that perform specific tasks",
                order: 3,
            },
        ],
    },
    {
        id: "chapter-2",
        title: "Data Structures and Algorithms",
        description: "Explore fundamental data structures like arrays, lists, and stacks, and learn basic algorithms for searching and sorting.",
        level: Level.CORE,
        order: 2,
        subject: "Computer Science",
        estimatedTime: 45,
        content: [
            {
                id: "section-2-1",
                title: "Arrays and Lists",
                content: "Arrays and lists are fundamental data structures that store collections of elements.\n\nArrays:\n• Fixed size collection of elements\n• Elements accessed by index\n• Fast access to elements\n\nLists:\n• Dynamic size collection\n• Can grow or shrink as needed\n• Flexible for adding/removing elements",
                order: 1,
            },
            {
                id: "section-2-2",
                title: "Stacks and Queues",
                content: "Stacks and queues are linear data structures with specific access patterns.\n\nStack (LIFO - Last In First Out):\n• Elements added and removed from the top\n• Operations: push (add), pop (remove)\n• Used in function calls, undo operations\n\nQueue (FIFO - First In First Out):\n• Elements added at rear, removed from front\n• Operations: enqueue (add), dequeue (remove)\n• Used in scheduling, buffering",
                order: 2,
            },
            {
                id: "section-2-3",
                title: "Searching Algorithms",
                content: "Searching algorithms help us find elements in data structures.\n\nLinear Search:\n• Check each element sequentially\n• Time complexity: O(n)\n• Works on unsorted data\n\nBinary Search:\n• Divide and conquer approach\n• Time complexity: O(log n)\n• Requires sorted data\n• Much faster for large datasets",
                order: 3,
            },
            {
                id: "section-2-4",
                title: "Sorting Algorithms",
                content: "Sorting algorithms arrange elements in a specific order.\n\nBubble Sort:\n• Compare adjacent elements and swap if needed\n• Time complexity: O(n²)\n• Simple but inefficient for large data\n\nQuick Sort:\n• Divide and conquer approach\n• Time complexity: O(n log n) average case\n• Efficient for large datasets",
                order: 4,
            },
        ],
    },
];

