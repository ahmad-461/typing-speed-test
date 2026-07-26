export interface Passage {
  id: string;
  text: string;
  category: "code_arena" | "knowledge_quest" | "ai_lab" | "world_explorer";
}

export interface PassageBank {
  easy: Passage[];
  medium: Passage[];
  hard: Passage[];
}

export const passageBank: PassageBank = {
  easy: [
    {
      id: "easy-code-1",
      category: "code_arena",
      text: "A variable is like a small labeled box that stores some important data or values inside a computer program. We can retrieve or change this stored data anytime we want.",
    },
    {
      id: "easy-code-2",
      category: "code_arena",
      text: "Coding is simply writing a list of step by step instructions that a computer can understand. We use programming languages to build amazing apps, websites, and fun games.",
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
      id: "medium-code-1",
      category: "code_arena",
      text: "Learning to write software represents a profound journey of discovery and constant problem solving. Writing high quality code requires patience, focus, and a willingness to learn from your mistakes. Every error message is not a setback, but rather a helpful guidepost pointing towards a better solution. Practice daily and watch your professional development flourish rapidly.",
    },
    {
      id: "medium-code-2",
      category: "code_arena",
      text: "Software developers often write functions to organize their instructions into small reusable blocks. Functions accept inputs, perform some calculations or operations, and return a useful output. Breaking down complex problems into smaller, well-designed functions is one of the most fundamental skills in computer engineering. It makes code readable, maintainable, and much easier to test.",
    },
    {
      id: "medium-quest-1",
      category: "knowledge_quest",
      text: "The golden retriever is widely celebrated for its gentle temperament and high intelligence. Originally bred for retrieving game during hunting expeditions, these dogs have become beloved family companions worldwide. They possess a natural eagerness to please their owners, making them highly receptive to training. Their beautiful water resistant coats require regular grooming to maintain their healthy shine.",
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
      id: "hard-code-1",
      category: "code_arena",
      text: "Implementing critical concurrent algorithms requires synchronization primitives to carefully avoid complex race conditions. Developers must thoroughly analyze memory structures, operational complexities, and potential deadlocks when writing highly distributed microservices. Optimization, although vital, must not precede clarity in software architecture; asynchronous interfaces demand rigorous telemetry and debugging protocols. Furthermore, multi-threaded execution environments frequently expose subtle synchronization anomalies that are exceptionally challenging to diagnose without comprehensive diagnostic logging and sophisticated profiling utilities.",
    },
    {
      id: "hard-code-2",
      category: "code_arena",
      text: "Modern functional programming paradigms encourage immutability and pure functions to minimize side effects in complex software systems. By ensuring that functions depend exclusively on their input arguments, developers can easily reason about application state transitions. This declarative approach significantly simplifies unit testing, parallel execution, and horizontal scaling across cloud infrastructures. However, adopting functional architectures requires a shift in cognitive patterns, transitioning away from imperative loops and mutable variables towards recursive evaluations and higher-order function compositions.",
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
      id: "hard-world-2",
      category: "world_explorer",
      text: "The Galapagos archipelago, situated in the vast Pacific Ocean, stands as an extraordinary living laboratory of evolutionary biology and unique ecological diversity. Isolated from the South American mainland for millions of years, these volcanic islands allowed species to adapt to highly specific microclimates, giving rise to marine iguanas, giant tortoises, and flightless cormorants. When Charles Darwin visited these shores aboard the HMS Beagle, his keen observations of these specialized creatures laid the groundwork for his groundbreaking theory of natural selection.",
    },
  ],
};
