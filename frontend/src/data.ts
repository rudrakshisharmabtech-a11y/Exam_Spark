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

export const exams: Exam[] = [
  {
    id: 1,
    title: "Cell Biology & Genetics",
    code: "BIO–204",
    subject: "Biology",
    duration: 45,
    questions: 5,
    marks: 10,
    date: "Today · until 4:30 PM",
    status: "Live",
    accent: "#2563eb",
  },
  {
    id: 2,
    title: "Applied Mathematics II",
    code: "MAT–210",
    subject: "Mathematics",
    duration: 90,
    questions: 40,
    marks: 100,
    date: "May 28 · 10:00 AM",
    status: "Upcoming",
    accent: "#14b8a6",
  },
  {
    id: 3,
    title: "Modern World History",
    code: "HIS–118",
    subject: "History",
    duration: 60,
    questions: 30,
    marks: 75,
    date: "May 31 · 1:00 PM",
    status: "Upcoming",
    accent: "#142b4a",
  },
  {
    id: 4,
    title: "Physics: Waves & Optics",
    code: "PHY–201",
    subject: "Physics",
    duration: 75,
    questions: 32,
    marks: 80,
    date: "May 12",
    status: "Completed",
    accent: "#3b82f6",
  },
  {
    id: 5,
    title: "English Composition",
    code: "ENG–110",
    subject: "English",
    duration: 50,
    questions: 25,
    marks: 50,
    date: "May 8",
    status: "Completed",
    accent: "#0d9488",
  },
  {
    id: 6,
    title: "Organic Chemistry",
    code: "CHE–206",
    subject: "Chemistry",
    duration: 60,
    questions: 30,
    marks: 75,
    date: "Jun 3 · 9:30 AM",
    status: "Draft",
    accent: "#1d4ed8",
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

export const questions = [
  {
    id: 1,
    topic: "Cell structure",
    difficulty: "Easy",
    text: "Which organelle is primarily responsible for producing ATP through cellular respiration?",
    options: ["Golgi apparatus", "Mitochondrion", "Lysosome", "Ribosome"],
    answer: 1,
    explanation: "Mitochondria generate most of the cell’s ATP through oxidative phosphorylation.",
  },
  {
    id: 2,
    topic: "Genetics",
    difficulty: "Medium",
    text: "In a monohybrid cross between two heterozygous individuals, what is the expected phenotypic ratio?",
    options: ["1 : 1", "3 : 1", "1 : 2 : 1", "9 : 3 : 3 : 1"],
    answer: 1,
    explanation: "A cross of Aa × Aa gives a 3 dominant : 1 recessive phenotypic ratio.",
  },
  {
    id: 3,
    topic: "Cell transport",
    difficulty: "Medium",
    text: "A cell placed in a hypertonic solution will most likely:",
    options: [
      "Gain water and swell",
      "Remain unchanged",
      "Lose water and shrink",
      "Immediately divide",
    ],
    answer: 2,
    explanation: "Water moves out of the cell toward the higher solute concentration.",
  },
  {
    id: 4,
    topic: "Molecular biology",
    difficulty: "Hard",
    text: "Which enzyme joins Okazaki fragments during DNA replication?",
    options: ["DNA helicase", "DNA polymerase", "DNA ligase", "Primase"],
    answer: 2,
    explanation: "DNA ligase seals the phosphodiester backbone between adjacent Okazaki fragments.",
  },
  {
    id: 5,
    topic: "Genetics",
    difficulty: "Easy",
    text: "What term describes alternative forms of the same gene?",
    options: ["Alleles", "Chromatids", "Genomes", "Centromeres"],
    answer: 0,
    explanation: "Alleles are variant forms of a gene found at the same chromosomal locus.",
  },
];

export const studentStudySnapshots = [
  {
    student: "Maya Chen",
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
    student: "Maya Chen",
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

export const teacherSubjectScores = [
  { subject: "Biology", scores: [82, 76, 91, 68, 89, 84] },
  { subject: "Mathematics", scores: [74, 81, 69, 88, 63, 75] },
  { subject: "History", scores: [68, 72, 81, 59, 77, 65] },
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
