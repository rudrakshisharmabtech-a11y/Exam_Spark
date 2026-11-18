export type Exam = {
  id: number;
  title: string;
  code: string;
  subject: string;
  duration: number;
  questions: number;
  marks: number;
  date: string;
  status: "Live" | "Upcoming" | "Completed" | "Draft";
  accent: string;
};

export const courseSubjects = [
  "Database Management System",
  "Programming in Java",
  "Data Structures and Algorithms",
  "Discrete Structures",
  "Advanced Web Technologies",
  "Operating Systems",
  "Computer Systems",
];

export const exams: Exam[] = [
  {
    id: 1,
    title: "Database Management System",
    code: "DBMS–301",
    subject: "Database Management System",
    duration: 45,
    questions: 5,
    marks: 10,
    date: "Today · until 4:30 PM",
    status: "Live",
    accent: "#2563eb",
  },
  {
    id: 2,
    title: "Programming in Java",
    code: "JAVA–204",
    subject: "Programming in Java",
    duration: 60,
    questions: 30,
    marks: 60,
    date: "Tomorrow · 10:00 AM",
    status: "Upcoming",
    accent: "#14b8a6",
  },
  {
    id: 3,
    title: "Data Structures and Algorithms",
    code: "DSA–220",
    subject: "Data Structures and Algorithms",
    duration: 75,
    questions: 35,
    marks: 70,
    date: "Friday · 1:00 PM",
    status: "Upcoming",
    accent: "#142b4a",
  },
  {
    id: 4,
    title: "Discrete Structures",
    code: "MATH–215",
    subject: "Discrete Structures",
    duration: 60,
    questions: 30,
    marks: 60,
    date: "Nov 17",
    status: "Completed",
    accent: "#3b82f6",
  },
  {
    id: 5,
    title: "Advanced Web Technologies",
    code: "AWT–310",
    subject: "Advanced Web Technologies",
    duration: 60,
    questions: 25,
    marks: 50,
    date: "Nov 18",
    status: "Completed",
    accent: "#0d9488",
  },
  {
    id: 6,
    title: "Operating Systems",
    code: "OS–302",
    subject: "Operating Systems",
    duration: 60,
    questions: 30,
    marks: 60,
    date: "Nov 24 · 9:30 AM",
    status: "Draft",
    accent: "#1d4ed8",
  },
  {
    id: 7,
    title: "Computer Systems",
    code: "CS–201",
    subject: "Computer Systems",
    duration: 60,
    questions: 30,
    marks: 60,
    date: "Nov 26 · 11:00 AM",
    status: "Upcoming",
    accent: "#0f766e",
  },
];

export type LearningResource = {
  title: string;
  platform: string;
  url: string;
  description: string;
};

export type WeakTopicInsight = {
  topic: string;
  mastery: number;
  trend: "Improving" | "Needs review" | "At risk";
  summary: string;
  actions: string[];
  resources: LearningResource[];
};

export type StudentExamAnalysis = {
  student: string;
  examId: number;
  examCode: string;
  examTitle: string;
  overallScore: number;
  readiness: number;
  strengths: string[];
  summary: string;
  weakTopics: WeakTopicInsight[];
  nextSteps: string[];
};

export const studentExamAnalyses: StudentExamAnalysis[] = [
  {
    student: "Maya Chen",
    examId: 1,
    examCode: "BIO–204",
    examTitle: "Cell Biology & Genetics",
    overallScore: 76,
    readiness: 71,
    strengths: ["Cell structure recall", "Diagram interpretation", "Gene terminology"],
    summary:
      "You are strongest when the task is recognition-based, but the analysis shows your application skills drop when water movement, genetic ratios, and cellular reasoning are combined.",
    weakTopics: [
      {
        topic: "Cell transport and osmosis",
        mastery: 57,
        trend: "Needs review",
        summary:
          "You can identify hypertonic and hypotonic terms, but you still mix up the direction of water movement under pressure and concentration changes.",
        actions: [
          "Sketch out cell diagrams for isotonic, hypertonic, and hypotonic solutions side by side.",
          "Memorize the rule: water moves toward the higher solute concentration.",
          "Practice 5 quick scenario questions before each revision session.",
        ],
        resources: [
          {
            title: "Osmosis explained with real cell examples",
            platform: "Khan Academy",
            url: "https://www.khanacademy.org/science/biology/cellular-transport-and-signaling",
            description: "Biology videos on transport, diffusion, and osmosis.",
          },
          {
            title: "Cell transport search on YouTube",
            platform: "YouTube",
            url: "https://www.youtube.com/results?search_query=cell+transport+osmosis+biology+explained",
            description: "Short, visual explanations of osmotic movement and concentration gradients.",
          },
        ],
      },
      {
        topic: "Genetic ratios and phenotype prediction",
        mastery: 62,
        trend: "Improving",
        summary:
          "You are consistent with basic dominant/recessive vocabulary but often lose points when a word problem asks for the final ratio or phenotype count.",
        actions: [
          "Convert every genetic question into a Punnett square first.",
          "Separate genotype and phenotype before calculating ratios.",
          "Review 3 classic monohybrid and dihybrid examples each week.",
        ],
        resources: [
          {
            title: "Punnett squares and inheritance patterns",
            platform: "OpenStax Biology",
            url: "https://openstax.org/books/biology-2e/pages/12-2-mendelian-inheritance",
            description: "A solid explanation of inheritance and probability.",
          },
          {
            title: "Genetics problem solving on YouTube",
            platform: "YouTube",
            url: "https://www.youtube.com/results?search_query=punnett+square+genetics+practice+problems",
            description: "Worked examples for dominant, recessive, and ratio-based questions.",
          },
        ],
      },
      {
        topic: "Mitochondrial function and ATP production",
        mastery: 71,
        trend: "At risk",
        summary:
          "You understand the label and function but can miss the reason why the inner membrane is folded and how that supports ATP production.",
        actions: [
          "Link structure to purpose: surface area, ATP output, and cellular respiration.",
          "Use a 3-part recall chain: organelle → structure → function.",
          "Re-check one diagram-based question per study block.",
        ],
        resources: [
          {
            title: "Mitochondria as the cell's powerhouse",
            platform: "BBC Bitesize",
            url: "https://www.bbc.co.uk/bitesize/topics/zfxxsbk",
            description: "Clear, exam-friendly overview of cell biology and organelles.",
          },
          {
            title: "Cell organelles explained",
            platform: "YouTube",
            url: "https://www.youtube.com/results?search_query=cell+organelles+mitochondria+atp+biology",
            description: "Visual explanations connecting structure and function.",
          },
        ],
      },
    ],
    nextSteps: [
      "Do one 15-minute recap of gene ratios before your next exam session.",
      "Revisit diagrams for osmosis and active transport using a labelled sketch routine.",
      "Attempt 10 mixed cell biology questions under timed conditions to build confidence.",
    ],
  },
  {
    student: "Maya Chen",
    examId: 2,
    examCode: "MAT–210",
    examTitle: "Applied Mathematics II",
    overallScore: 81,
    readiness: 78,
    strengths: ["Algebraic manipulation", "Function reasoning", "Problem sequencing"],
    summary:
      "Your math foundation is excellent, but the biggest gains still come from acted-out calculus steps and confidence with multi-part problems.",
    weakTopics: [
      {
        topic: "Derivative applications",
        mastery: 68,
        trend: "Needs review",
        summary:
          "You are comfortable with derivative notation but need more deliberate thinking about optimization and rate-of-change problems.",
        actions: [
          "Translate each word problem into variables before differentiating.",
          "Check whether the calculator result matches the real-world meaning of the problem.",
          "Review 3 optimization questions each week.",
        ],
        resources: [
          {
            title: "Optimization and derivatives",
            platform: "Khan Academy",
            url: "https://www.khanacademy.org/math/calculus-1",
            description: "Practice-based lessons on derivative applications.",
          },
          {
            title: "Calculus derivative applications search",
            platform: "YouTube",
            url: "https://www.youtube.com/results?search_query=optimization+calculus+derivative+word+problems",
            description: "Worked examples for optimization and related rates.",
          },
        ],
      },
      {
        topic: "Integral techniques",
        mastery: 74,
        trend: "Improving",
        summary:
          "The underlying concept is clear, but the execution remains uneven when the problem requires substitution or a non-standard setup.",
        actions: [
          "Underline the form you see before choosing a method.",
          "Check your antiderivative by differentiating it back.",
          "Solve one substitution problem without notes each session.",
        ],
        resources: [
          {
            title: "Integration by substitution",
            platform: "Paul's Online Math Notes",
            url: "https://tutorial.math.lamar.edu/Classes/CalcII/IntegrationTechniques.aspx",
            description: "A practical, exam-focused guide to common integration methods.",
          },
          {
            title: "Integration methods on YouTube",
            platform: "YouTube",
            url: "https://www.youtube.com/results?search_query=integration+by+substitution+calculus+examples",
            description: "Step-by-step approaches to common integral questions.",
          },
        ],
      },
    ],
    nextSteps: [
      "Practice one optimization task per day with the variable-identification process written out.",
      "Build a small error log for signed calculations and final unit checks.",
      "Use a timer on 3 mixed calculus questions to improve fluency.",
    ],
  },
  {
    student: "Noah Williams",
    examId: 1,
    examCode: "BIO–204",
    examTitle: "Cell Biology & Genetics",
    overallScore: 69,
    readiness: 64,
    strengths: ["Short-answer recall", "Labeling diagrams", "Vocabulary recognition"],
    summary:
      "Noah is improving on direct recall, but there is a larger gap in application reasoning, especially in transport and genetics comparison questions.",
    weakTopics: [
      {
        topic: "Cell transport and osmosis",
        mastery: 52,
        trend: "At risk",
        summary:
          "The biggest issue is applying the rule when the question uses multiple variables or asks for net movement rather than just vocabulary.",
        actions: [
          "Create a one-page summary of each transport process and its direction of movement.",
          "Practice with scenario cards where you have to explain why water moves in or out.",
          "Rework each missed question into a written explanation.",
        ],
        resources: [
          {
            title: "Osmosis and diffusion overview",
            platform: "Crash Course Biology",
            url: "https://www.youtube.com/results?search_query=crash+course+biology+diffusion+osmosis",
            description: "Fast, memorable explanations of membrane transport.",
          },
          {
            title: "Membrane transport textbook notes",
            platform: "Lumen Learning",
            url: "https://courses.lumenlearning.com/suny-biom101/chapter/passive-transport/",
            description: "A clear breakdown of passive transport and water movement.",
          },
        ],
      },
      {
        topic: "Genetic inheritance logic",
        mastery: 58,
        trend: "Needs review",
        summary:
          "The patterns are known, but the final percentage or genotype ratio is often computed without checking the setup.",
        actions: [
          "Write the parent genotypes before solving the cross.",
          "Use a table for phenotype and genotype counts.",
          "Compare each answer to the expected ratio range before finalizing.",
        ],
        resources: [
          {
            title: "Mendelian genetics explained",
            platform: "Khan Academy",
            url: "https://www.khanacademy.org/science/biology/classical-genetics",
            description: "A strong starting point for genotype, phenotype, and ratios.",
          },
          {
            title: "Punnett square practice",
            platform: "YouTube",
            url: "https://www.youtube.com/results?search_query=punnett+square+biology+explanation",
            description: "Video walkthroughs for dominant and recessive inheritance.",
          },
        ],
      },
    ],
    nextSteps: [
      "Build a mini review sheet for transport and genetics that gets reused before every test.",
      "Complete two scored mini-sets before the next exam block.",
      "Ask for one explanation each week on the question type you most often miss.",
    ],
  },
];

export const courseExamAnalyses: StudentExamAnalysis[] = [
  {
    student: "Rudrakshi Sharma",
    examId: 1,
    examCode: "DBMS–301",
    examTitle: "Database Management System",
    overallScore: 76,
    readiness: 71,
    strengths: ["Relational model concepts", "SQL query structure", "Entity-relationship diagrams"],
    summary: "You understand the core database concepts. Practice normalization and multi-table queries to improve your problem-solving accuracy.",
    weakTopics: [
      {
        topic: "Normalization and functional dependencies",
        mastery: 57,
        trend: "Needs review",
        summary: "Review how functional dependencies guide decomposition into 2NF and 3NF without losing data.",
        actions: ["Identify candidate keys before decomposing a relation.", "Check each decomposition for lossless joins.", "Work through one normalization example each day."],
        resources: [
          { title: "Normalization tutorial", platform: "GeeksforGeeks", url: "https://www.geeksforgeeks.org/database-normalization-normal-forms/", description: "Examples of functional dependencies and normal forms." },
          { title: "Normalization video lessons", platform: "YouTube", url: "https://www.youtube.com/results?search_query=DBMS+normalization+1NF+2NF+3NF+examples", description: "Worked examples for database normalization." },
        ],
      },
      {
        topic: "SQL joins and aggregation",
        mastery: 68,
        trend: "Improving",
        summary: "You can write basic SELECT queries; practice joins and grouping when information comes from multiple tables.",
        actions: ["Draw the join relationship before writing the query.", "Use GROUP BY with aggregate functions on sample tables.", "Test queries with empty and duplicate values."],
        resources: [
          { title: "SQL tutorial and practice", platform: "GeeksforGeeks", url: "https://www.geeksforgeeks.org/sql-tutorial/", description: "SQL examples covering joins, grouping, and subqueries." },
          { title: "SQL joins video lessons", platform: "YouTube", url: "https://www.youtube.com/results?search_query=SQL+joins+and+group+by+tutorial", description: "Visual explanations and query walkthroughs." },
        ],
      },
    ],
    nextSteps: ["Complete one 3NF decomposition exercise.", "Write three JOIN queries using a small student-course database.", "Review keys and constraints before the next practice test."],
  },
  {
    student: "Rudrakshi Sharma",
    examId: 2,
    examCode: "JAVA–204",
    examTitle: "Programming in Java",
    overallScore: 81,
    readiness: 78,
    strengths: ["Java syntax", "Class design", "Basic control flow"],
    summary: "Your Java foundations are strong. Focus on collections, exceptions, and explaining object-oriented design decisions.",
    weakTopics: [
      {
        topic: "Object-oriented programming",
        mastery: 68,
        trend: "Needs review",
        summary: "Practice choosing class responsibilities and using encapsulation, inheritance, and interfaces appropriately.",
        actions: ["Model a small problem with classes before coding.", "Keep fields private and expose intentional methods.", "Compare an interface-based solution with inheritance."],
        resources: [
          { title: "Java learning path", platform: "dev.java", url: "https://dev.java/learn/", description: "Official Java language and object-oriented programming guides." },
          { title: "Java OOP practice", platform: "GeeksforGeeks", url: "https://www.geeksforgeeks.org/object-oriented-programming-oops-concept-in-java/", description: "OOP concepts with Java examples." },
        ],
      },
      {
        topic: "Collections and exception handling",
        mastery: 74,
        trend: "Improving",
        summary: "Strengthen your choice of collection types and make sure errors are handled at the right level.",
        actions: ["Choose List, Set, or Map based on the data you need.", "Handle expected exceptions without hiding unexpected errors.", "Write a short test for empty and invalid inputs."],
        resources: [
          { title: "Java collections tutorial", platform: "GeeksforGeeks", url: "https://www.geeksforgeeks.org/collections-in-java-2/", description: "Collection interfaces, implementations, and examples." },
          { title: "Java programming video lessons", platform: "YouTube", url: "https://www.youtube.com/results?search_query=Java+collections+exception+handling+tutorial", description: "Walkthroughs for collections and robust Java programs." },
        ],
      },
    ],
    nextSteps: ["Implement a small gradebook using classes and a Map.", "Add validation and clear exception handling.", "Review one Java coding problem each day."],
  },
  {
    student: "Rudrakshi Sharma",
    examId: 3,
    examCode: "DSA–220",
    examTitle: "Data Structures and Algorithms",
    overallScore: 69,
    readiness: 64,
    strengths: ["Array traversal", "Problem decomposition", "Basic sorting"],
    summary: "Build confidence by stating the time and space complexity before implementing each solution.",
    weakTopics: [
      {
        topic: "Trees and graph traversal",
        mastery: 58,
        trend: "Needs review",
        summary: "Practice choosing BFS or DFS and tracking visited nodes to avoid repeated work.",
        actions: ["Trace traversal order on a small example.", "Use a queue for BFS and a stack or recursion for DFS.", "Write the time complexity beside each solution."],
        resources: [
          { title: "Tree and graph tutorials", platform: "GeeksforGeeks", url: "https://www.geeksforgeeks.org/graph-data-structure-and-algorithms/", description: "Graph representations, traversals, and practice." },
          { title: "DSA video course search", platform: "YouTube", url: "https://www.youtube.com/results?search_query=tree+and+graph+BFS+DFS+tutorial", description: "Visual explanations of common traversal algorithms." },
        ],
      },
    ],
    nextSteps: ["Solve two array or linked-list problems.", "Compare BFS and DFS on one graph.", "Record complexity for each solution."],
  },
];

export const questions = [
  {
    id: 1,
    topic: "Database Management System",
    difficulty: "Easy",
    text: "Which key uniquely identifies each row in a relational table?",
    options: ["Foreign key", "Primary key", "Composite attribute", "View"],
    answer: 1,
    explanation: "A primary key uniquely identifies each row and cannot contain duplicate values.",
  },
  {
    id: 2,
    topic: "Programming in Java",
    difficulty: "Medium",
    text: "Which object-oriented principle keeps an object's data hidden behind methods?",
    options: ["Inheritance", "Encapsulation", "Compilation", "Iteration"],
    answer: 1,
    explanation: "Encapsulation bundles data with methods and controls access to an object's state.",
  },
  {
    id: 3,
    topic: "Data Structures and Algorithms",
    difficulty: "Medium",
    text: "What is the time complexity of binary search on a sorted array?",
    options: ["O(n)", "O(log n)", "O(n log n)", "O(1)"],
    answer: 1,
    explanation: "Binary search halves the remaining search interval at each step, so it takes O(log n) time.",
  },
  {
    id: 4,
    topic: "Operating Systems",
    difficulty: "Hard",
    text: "What is a context switch in an operating system?",
    options: ["Changing a file format", "Saving one process state and restoring another", "Compiling a program", "Allocating a database key"],
    answer: 1,
    explanation: "A context switch saves the current process state and restores another so the CPU can switch tasks.",
  },
  {
    id: 5,
    topic: "Discrete Structures",
    difficulty: "Easy",
    text: "What is the cardinality of the set {a, b, c}?",
    options: ["1", "2", "3", "4"],
    answer: 2,
    explanation: "Cardinality is the number of distinct elements in a set, which is 3 here.",
  },
];

export const studentStudySnapshots = [
  {
    student: "Rudrakshi Sharma",
    examId: 1,
    practiceScore: 76,
    completedTopics: 8,
    totalTopics: 10,
    weeklyActivity: [
      { day: "M", active: true },
      { day: "T", active: true },
      { day: "W", active: false },
      { day: "T", active: true },
      { day: "F", active: true },
      { day: "S", active: true },
      { day: "S", active: true },
    ],
  },
  {
    student: "Rudrakshi Sharma",
    examId: 2,
    practiceScore: 81,
    completedTopics: 7,
    totalTopics: 10,
    weeklyActivity: [
      { day: "M", active: true },
      { day: "T", active: true },
      { day: "W", active: true },
      { day: "T", active: false },
      { day: "F", active: true },
      { day: "S", active: false },
      { day: "S", active: true },
    ],
  },
] as const;

export const teacherLiveAttempts = {
  submitted: 64,
  inProgress: 82,
  pending: 40,
};

export const teacherQuestionIncorrectRates: Record<number, number> = {
  1: 12,
  2: 48,
  3: 64,
  4: 71,
  5: 22,
};

export const demoClassStudents = [
  { name: "Rudrakshi Sharma", section: "A", examsCompleted: 5, averageScore: 84 },
  { name: "Ayanshu", section: "A", examsCompleted: 5, averageScore: 78 },
  { name: "Geetali", section: "A", examsCompleted: 4, averageScore: 91 },
  { name: "Khushi", section: "A", examsCompleted: 5, averageScore: 72 },
];

export const demoTeacherMonitor = [
  { examId: 1, title: "Database Management System", attempts: 4, submitted: 4, inProgress: 0, pending: 0 },
  { examId: 2, title: "Programming in Java", attempts: 5, submitted: 4, inProgress: 1, pending: 0 },
  { examId: 3, title: "Data Structures and Algorithms", attempts: 5, submitted: 4, inProgress: 1, pending: 0 },
  { examId: 4, title: "Discrete Structures", attempts: 3, submitted: 3, inProgress: 0, pending: 0 },
  { examId: 5, title: "Advanced Web Technologies", attempts: 4, submitted: 3, inProgress: 1, pending: 0 },
  { examId: 7, title: "Computer Systems", attempts: 3, submitted: 2, inProgress: 1, pending: 0 },
];

export const demoTeacherAnalytics = [
  { examId: 1, title: "Database Management System", subject: "Database Management System", submissions: 4, averagePercentage: 82, highestPercentage: 95, passing: 4 },
  { examId: 2, title: "Programming in Java", subject: "Programming in Java", submissions: 4, averagePercentage: 76, highestPercentage: 91, passing: 3 },
  { examId: 3, title: "Data Structures and Algorithms", subject: "Data Structures and Algorithms", submissions: 4, averagePercentage: 71, highestPercentage: 86, passing: 3 },
  { examId: 4, title: "Discrete Structures", subject: "Discrete Structures", submissions: 3, averagePercentage: 85, highestPercentage: 95, passing: 3 },
  { examId: 5, title: "Advanced Web Technologies", subject: "Advanced Web Technologies", submissions: 3, averagePercentage: 80, highestPercentage: 92, passing: 3 },
  { examId: 7, title: "Computer Systems", subject: "Computer Systems", submissions: 2, averagePercentage: 73, highestPercentage: 84, passing: 2 },
];

export const demoTeacherQuestionAnalytics = [
  { examId: 1, examTitle: "Database Management System", questionId: 1, topic: "Primary keys", prompt: "Which key uniquely identifies each row?", responses: 16, incorrect: 2, incorrectRate: 12 },
  { examId: 2, examTitle: "Programming in Java", questionId: 2, topic: "Encapsulation", prompt: "Which principle hides object data behind methods?", responses: 16, incorrect: 8, incorrectRate: 50 },
  { examId: 3, examTitle: "Data Structures and Algorithms", questionId: 3, topic: "Binary search", prompt: "What is the time complexity of binary search?", responses: 16, incorrect: 10, incorrectRate: 63 },
  { examId: 6, examTitle: "Operating Systems", questionId: 4, topic: "Context switching", prompt: "What happens during a context switch?", responses: 12, incorrect: 8, incorrectRate: 67 },
  { examId: 4, examTitle: "Discrete Structures", questionId: 5, topic: "Set cardinality", prompt: "What is the cardinality of a three-element set?", responses: 12, incorrect: 3, incorrectRate: 25 },
];

export const teacherSubjectScores = [
  { subject: "Database Management System", scores: [82, 76, 91, 68, 89, 84] },
  { subject: "Programming in Java", scores: [74, 81, 69, 88, 63, 75] },
  { subject: "Data Structures and Algorithms", scores: [68, 72, 81, 59, 77, 65] },
];

export const users = [
  {
    name: "Maya Chen",
    email: "maya.chen@demo.edu",
    role: "Student",
    status: "Active",
    activity: "2 min ago",
    initials: "MC",
  },
  {
    name: "Dr. Elias Ford",
    email: "elias.ford@demo.edu",
    role: "Teacher",
    status: "Active",
    activity: "18 min ago",
    initials: "EF",
  },
  {
    name: "Noah Williams",
    email: "noah.w@demo.edu",
    role: "Student",
    status: "Active",
    activity: "1 hour ago",
    initials: "NW",
  },
  {
    name: "Sofia Patel",
    email: "sofia.p@demo.edu",
    role: "Student",
    status: "Inactive",
    activity: "May 12",
    initials: "SP",
  },
  {
    name: "Prof. Ana Silva",
    email: "ana.silva@demo.edu",
    role: "Teacher",
    status: "Active",
    activity: "Yesterday",
    initials: "AS",
  },
  {
    name: "Leo Martinez",
    email: "leo.m@demo.edu",
    role: "Student",
    status: "Active",
    activity: "Yesterday",
    initials: "LM",
  },
];
