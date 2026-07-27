export interface Passage {
  id: string;
  text: string;
  category: "code_arena" | "knowledge_quest" | "ai_lab" | "world_explorer" | "weak_key_drill" | "speed_sprint";
}

export interface PassageBank {
  easy: Passage[];
  medium: Passage[];
  hard: Passage[];
}

export const passageBank: PassageBank = {
  easy: [
    {
      id: "easy-sprint-1",
      category: "speed_sprint",
      text: "Speed typing requires absolute focus and quick finger movements across the keys.",
    },
    {
      id: "easy-sprint-2",
      category: "speed_sprint",
      text: "Every perfect keystroke builds momentum and elevates your final words per minute.",
    },
    {
      id: "easy-sprint-3",
      category: "speed_sprint",
      text: "Keep a relaxed posture to easily reduce tension while typing fast under pressure.",
    },
    {
      id: "easy-drill-1",
      category: "weak_key_drill",
      text: "The quick brown fox jumps over the lazy dog.",
    },
    {
      id: "easy-drill-2",
      category: "weak_key_drill",
      text: "Pack my box with five dozen liquor jugs.",
    },
    {
      id: "easy-drill-3",
      category: "weak_key_drill",
      text: "A quick movement of the enemy will jeopardize six gunboats.",
    },
    {
      id: "easy-code-1",
      category: "code_arena",
      text: "Python is a popular programming language known for its clear syntax and great readability. It is widely used in data science, web development, and automation tasks around the world.",
    },
    {
      id: "easy-code-2",
      category: "code_arena",
      text: "JavaScript powers the interactive features of modern websites. It allows developers to build dynamic elements, handle clicks, and fetch web data seamlessly inside any browser.",
    },
    {
      id: "easy-code-3",
      category: "code_arena",
      text: "HTML provides the structure of a webpage, while CSS handles the visual style and layout. Together, they form the foundation of everything we see and interact with online.",
    },
    {
      id: "easy-code-4",
      category: "code_arena",
      text: "SQL is the standard language used to communicate with databases. It allows developers to quickly query, insert, update, and manage large amounts of structured data.",
    },
    {
      id: "easy-quest-1",
      category: "knowledge_quest",
      text: "The beautiful blue planet we live on is called Earth. It is the third planet from the Sun and the only world known to support active life.",
    },
    {
      id: "easy-quest-2",
      category: "knowledge_quest",
      text: "A fresh cup of hot green tea in the morning is wonderful. It is full of antioxidants that help to start your day with calm energy.",
    },
    {
      id: "easy-ai-1",
      category: "ai_lab",
      text: "Smart neural networks learn from large collections of digital photos to recognize cute dogs and cats with high precision and speed.",
    },
    {
      id: "easy-ai-2",
      category: "ai_lab",
      text: "Artificial intelligence helps modern self driving cars navigate busy city streets safely by constantly checking their fast laser sensors.",
    },
    {
      id: "easy-world-1",
      category: "world_explorer",
      text: "The majestic Mount Fuji stands as a silent sentinel of snow and stone, watching over the green forests and busy cities of Japan.",
    },
    {
      id: "easy-world-2",
      category: "world_explorer",
      text: "Sailing down the winding Nile River at sunset reveals ancient stone temples and golden sand dunes that have stood for thousands of years.",
    },
  ],
  medium: [
    {
      id: "medium-sprint-1",
      category: "speed_sprint",
      text: "Precision and rhythm are essential for achieving outstanding speed on mechanical keyboard switches.",
    },
    {
      id: "medium-sprint-2",
      category: "speed_sprint",
      text: "Challenge yourself with short daily typing practice sessions to consistently improve hand eye coordination.",
    },
    {
      id: "medium-code-1",
      category: "code_arena",
      text: "Python has grown to become one of the most influential programming languages in existence today. Its elegant design and emphasis on readability allow both beginners and experts to write clean and concise code. Python excels in scientific computing, machine learning, and automation, supported by a massive global community that continuously builds open source libraries to solve complex modern challenges.",
    },
    {
      id: "medium-code-2",
      category: "code_arena",
      text: "JavaScript has evolved from a simple scripting tool into a powerhouse of modern software development. It runs natively in every web browser, enabling rich client-side interactions and fluid user interfaces. With the advent of server-side runtimes like Node, JavaScript developers can build entire full-stack applications using a single language, making it highly versatile and popular.",
    },
    {
      id: "medium-code-3",
      category: "code_arena",
      text: "HTML and CSS are the twin pillars of frontend web development, working in perfect harmony to deliver digital experiences. HTML establishes the semantic hierarchy and content structure, while CSS defines the aesthetics, animations, responsive layouts, and typography. Modern CSS features, such as Flexbox and Grid, allow developers to create highly adaptive interfaces for any screen size.",
    },
    {
      id: "medium-code-4",
      category: "code_arena",
      text: "SQL, or Structured Query Language, is the indispensable standard for managing relational databases. It provides a declarative way to query and manipulate structured tables of information. By writing optimized queries, developers can retrieve precise datasets, join complex tables, and aggregate millions of rows of data in milliseconds, ensuring that modern applications remain fast and reliable.",
    },
    {
      id: "medium-quest-1",
      category: "knowledge_quest",
      text: "The golden retriever is widely celebrated for its gentle temperament and high intelligence. Originally bred for retrieving game during hunting expeditions, these dogs have become beloved family companions worldwide. They possess a natural eagerness to please their owners, making them highly receptive to training. Their beautiful water resistant coats require regular grooming to maintain their healthy shine.",
    },
    {
      id: "medium-drill-1",
      category: "weak_key_drill",
      text: "We promptly judged antique ivory buckles for the next prize. The crazy wizard expressed quiet joy as his complex machine solved the heavy puzzle perfectly.",
    },
    {
      id: "medium-drill-2",
      category: "weak_key_drill",
      text: "Sixty zippers were quickly unfastened by the jolly crew during the storm. Exploring the rugged mountain path required extra caution, brave zeal, and steady hands.",
    },
    {
      id: "medium-quest-2",
      category: "knowledge_quest",
      text: "The Solar System is an incredibly vast cosmic neighborhood composed of the Sun and all the celestial objects bound to it by gravity. This includes eight major planets, numerous dwarf planets, hundreds of moons, and millions of asteroids. Scientists continue to explore these remote celestial bodies using advanced space telescopes and robotic probes, searching for clues about the origins of life.",
    },
    {
      id: "medium-ai-1",
      category: "ai_lab",
      text: "Large language models are trained on massive datasets to understand context, predict the next word, and generate natural responses. By processing millions of sentences, these neural networks discover complex linguistic patterns that enable them to assist humans with writing, coding, and brainstorming ideas.",
    },
    {
      id: "medium-ai-2",
      category: "ai_lab",
      text: "Generative adversarial networks use two competing neural models to synthesize realistic images, audio tracks, and virtual environments. While the generator attempts to create authentic synthetic media, the discriminator works diligently to detect any subtle imperfections, driving rapid learning in both sub-systems.",
    },
    {
      id: "medium-world-1",
      category: "world_explorer",
      text: "Wandering through the vibrant spice markets of Marrakech is a sensory adventure unlike any other. The air is thick with the sweet aroma of ground cinnamon, dried cloves, and fresh mint, while towering bags of colorful saffron and paprika create a breathtaking tapestry that captures the historic spirit of Morocco.",
    },
    {
      id: "medium-world-2",
      category: "world_explorer",
      text: "Deep within the dense and misty Peruvian Andes lies Machu Picchu, the ancient stone citadel built by the Inca Empire. Surrounded by emerald peaks and sheer cliffs, the meticulously crafted terraces and granite temples remain a legendary testament to historical engineering, drawing curious travelers from every corner of the globe.",
    },
  ],
  hard: [
    {
      id: "hard-sprint-1",
      category: "speed_sprint",
      text: "Absolute cognitive sync and rapid muscle reflexes allow top competitors to exceed hundred words per minute.",
    },
    {
      id: "hard-code-1",
      category: "code_arena",
      text: "Python relies on a design philosophy that prioritizes developer productivity and code readability, famously summarized in the Zen of Python. Under the hood, Python utilizes automatic memory management and dynamic typing, executing code through an interpreter. While its global interpreter lock can present concurrency challenges in CPU-bound applications, Python overcomes performance bottlenecks by offloading heavy computations to highly optimized C extensions. This unique balance of ease of use and high-performance integration has made it the undisputed language of choice for cutting-edge artificial intelligence, data engineering, and scientific research.",
    },
    {
      id: "hard-code-2",
      category: "code_arena",
      text: "JavaScript operates on a single-threaded event loop architecture that utilizes non-blocking input and output operations, making it exceptionally efficient for modern asynchronous applications. When executed in browser engines, JavaScript undergoes just-in-time compilation to execute complex logic at near-native speeds. Developers leverage advanced features like closures, prototypes, and asynchronous promises to build highly interactive web applications. Navigating the vast ecosystem of packaging tools, transpilers, and framework architectures requires a deep understanding of memory management, execution contexts, and the ever-evolving standards of ECMAScript.",
    },
    {
      id: "hard-code-3",
      category: "code_arena",
      text: "HTML and CSS form the bedrock of the modern semantic web, requiring a sophisticated understanding of layout engines, document object model painting, and browser rendering pipelines. Modern HTML demands strict accessibility compliance and search engine optimization, while advanced CSS incorporates complex layout architectures, custom property design systems, and hardware-accelerated animations. Frontend engineers must master rendering behaviors, such as cumulative layout shifts, z-index stacking contexts, CSS containment, and performance optimization across diverse mobile and desktop devices to deliver seamless web user experiences.",
    },
    {
      id: "hard-code-4",
      category: "code_arena",
      text: "SQL database engines employ sophisticated cost-based query optimizers to determine the most efficient execution paths for retrieving relational datasets. Developers must analyze index selection, execution plans, and transaction isolation levels to prevent concurrency anomalies like dirty reads or serialization failures. Advanced SQL techniques include window functions, recursive common table expressions, and partitioned tables, which allow for the processing of massive analytical workloads. Designing resilient schema migrations and tuning queries for high-throughput database systems are critical skills for backend architects managing global enterprise applications.",
    },
    {
      id: "hard-quest-1",
      category: "knowledge_quest",
      text: "Philosophical paradigms surrounding cognitive science often query whether artificial neural networks can possess genuine subjective consciousness or semantic comprehension. While modern deep learning architectures demonstrate remarkable capabilities in pattern recognition and linguistic synthesis, they operate primarily through statistical correlations rather than conceptual introspection. Consequently, the ontological gap between computational simulation and actual cognitive awareness remains a highly debated topic among leading contemporary scholars. Investigating these complex epistemological boundaries requires interdisciplinary cooperation between neuroscience, computer engineering, and theoretical philosophy.",
    },
    {
      id: "hard-quest-2",
      category: "knowledge_quest",
      text: "Astronomical observations using advanced high-resolution spectroscopy have revealed unique chemical anomalies in the atmospheres of distant exoplanets orbiting binary star systems. Spectroscopic data suggests the presence of vaporized heavy metals, including titanium and iron, alongside traces of water vapor and methane. Interpreting these complex atmospheric signatures requires sophisticated computational models that simulate extreme thermal dynamics and radiative transfer processes under intense stellar radiation. These breakthroughs significantly enhance our empirical understanding of planetary formation and the overall habitability of outer solar systems.",
    },
    {
      id: "hard-ai-1",
      category: "ai_lab",
      text: "The rapid evolution of deep reinforcement learning enables complex autonomous agents to master intricate strategic games and manipulate physical robotic systems with remarkable dexterity. By establishing dynamic reward functions and executing millions of trial-and-error simulation steps, these multi-layered neural models develop sophisticated heuristic strategies that frequently surpass human performance. However, scaling these high-dimensional computational architectures demands massive parallel processing infrastructure, sparking intense research into energy-efficient silicon designs and decentralized learning algorithms.",
    },
    {
      id: "hard-ai-2",
      category: "ai_lab",
      text: "Transformer-based architectures have fundamentally revolutionized natural language understanding by utilizing multi-head self-attention mechanisms to process contextual relationships across long sequences of text. Unlike legacy recurrent networks that parse tokens sequentially, transformers process entire paragraphs simultaneously, capturing subtle semantic nuances and long-range dependencies with unparalleled efficiency. This architectural breakthrough has paved the way for massive foundational models capable of generalized reasoning, code synthesis, and complex translation tasks.",
    },
    {
      id: "hard-world-1",
      category: "world_explorer",
      text: "The ancient silk road was not merely a singular trade route, but a massive web of historical paths that spanned across deserts, mountains, and plains to link China with the Mediterranean world. For centuries, merchant caravans braved unforgiving mountain passes and harsh dust storms to transport rare silk, fine porcelain, exotic spices, and radical scientific ideas. This dynamic cross-cultural exchange forever transformed the architecture, culinary traditions, and linguistic landscapes of legendary oasis cities like Samarkand and Bukhara.",
    },
    {
      id: "hard-drill-1",
      category: "weak_key_drill",
      text: "The wizard quickly jinxed the extremely heavy box of porcelain vases, causing a bizarre sequence of events. Quietly, the skeptical observers analyzed the colorful sparks flying in all directions, hoping to decipher the complex, ancient spell before the clock struck midnight.",
    },
    {
      id: "hard-drill-2",
      category: "weak_key_drill",
      text: "Juxtaposing abstract concepts with physical realities often requires extreme intellectual agility. Quiet philosophers zealously argue about the mysterious nature of existence, while practical engineers build complex gadgets to solve everyday puzzles with high accuracy.",
    },
    {
      id: "hard-world-2",
      category: "world_explorer",
      text: "The Galapagos archipelago, situated in the vast Pacific Ocean, stands as an extraordinary living laboratory of evolutionary biology and unique ecological diversity. Isolated from the South American mainland for millions of years, these volcanic islands allowed species to adapt to highly specific microclimates, giving rise to marine iguanas, giant tortoises, and flightless cormorants. When Charles Darwin visited these shores aboard the HMS Beagle, his keen observations of these specialized creatures laid the groundwork for his groundbreaking theory of natural selection.",
    },
  ],
};
