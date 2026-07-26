export interface Passage {
  id: string;
  text: string;
  category: "programming" | "general_knowledge";
}

export interface PassageBank {
  easy: Passage[];
  medium: Passage[];
  hard: Passage[];
}

export const passageBank: PassageBank = {
  easy: [
    {
      id: "easy-prog-1",
      category: "programming",
      text: "A variable is like a small labeled box that stores some important data or values inside a computer program. We can retrieve or change this stored data anytime we want.",
    },
    {
      id: "easy-prog-2",
      category: "programming",
      text: "Coding is simply writing a list of step by step instructions that a computer can understand. We use programming languages to build amazing apps, websites, and fun games.",
    },
    {
      id: "easy-gk-1",
      category: "general_knowledge",
      text: "The beautiful blue planet we live on is called Earth. It is the third planet from the Sun and the only world known to support active life.",
    },
    {
      id: "easy-gk-2",
      category: "general_knowledge",
      text: "A fresh cup of hot green tea in the morning is wonderful. It is full of antioxidants that help to start your day with calm energy.",
    },
  ],
  medium: [
    {
      id: "medium-prog-1",
      category: "programming",
      text: "Learning to write software represents a profound journey of discovery and constant problem solving. Writing high quality code requires patience, focus, and a willingness to learn from your mistakes. Every error message is not a setback, but rather a helpful guidepost pointing towards a better solution. Practice daily and watch your professional development flourish rapidly.",
    },
    {
      id: "medium-prog-2",
      category: "programming",
      text: "Software developers often write functions to organize their instructions into small reusable blocks. Functions accept inputs, perform some calculations or operations, and return a useful output. Breaking down complex problems into smaller, well-designed functions is one of the most fundamental skills in computer engineering. It makes code readable, maintainable, and much easier to test.",
    },
    {
      id: "medium-gk-1",
      category: "general_knowledge",
      text: "The golden retriever is widely celebrated for its gentle temperament and high intelligence. Originally bred for retrieving game during hunting expeditions, these dogs have become beloved family companions worldwide. They possess a natural eagerness to please their owners, making them highly receptive to training. Their beautiful water resistant coats require regular grooming to maintain their healthy shine.",
    },
    {
      id: "medium-gk-2",
      category: "general_knowledge",
      text: "The Solar System is an incredibly vast cosmic neighborhood composed of the Sun and all the celestial objects bound to it by gravity. This includes eight major planets, numerous dwarf planets, hundreds of moons, and millions of asteroids. Scientists continue to explore these remote celestial bodies using advanced space telescopes and robotic probes, searching for clues about the origins of life.",
    },
  ],
  hard: [
    {
      id: "hard-prog-1",
      category: "programming",
      text: "Implementing critical concurrent algorithms requires synchronization primitives to carefully avoid complex race conditions. Developers must thoroughly analyze memory structures, operational complexities, and potential deadlocks when writing highly distributed microservices. Optimization, although vital, must not precede clarity in software architecture; asynchronous interfaces demand rigorous telemetry and debugging protocols. Furthermore, multi-threaded execution environments frequently expose subtle synchronization anomalies that are exceptionally challenging to diagnose without comprehensive diagnostic logging and sophisticated profiling utilities.",
    },
    {
      id: "hard-prog-2",
      category: "programming",
      text: "Modern functional programming paradigms encourage immutability and pure functions to minimize side effects in complex software systems. By ensuring that functions depend exclusively on their input arguments, developers can easily reason about application state transitions. This declarative approach significantly simplifies unit testing, parallel execution, and horizontal scaling across cloud infrastructures. However, adopting functional architectures requires a shift in cognitive patterns, transitioning away from imperative loops and mutable variables towards recursive evaluations and higher-order function compositions.",
    },
    {
      id: "hard-gk-1",
      category: "general_knowledge",
      text: "Philosophical paradigms surrounding cognitive science often query whether artificial neural networks can possess genuine subjective consciousness or semantic comprehension. While modern deep learning architectures demonstrate remarkable capabilities in pattern recognition and linguistic synthesis, they operate primarily through statistical correlations rather than conceptual introspection. Consequently, the ontological gap between computational simulation and actual cognitive awareness remains a highly debated topic among leading contemporary scholars. Investigating these complex epistemological boundaries requires interdisciplinary cooperation between neuroscience, computer engineering, and theoretical philosophy.",
    },
    {
      id: "hard-gk-2",
      category: "general_knowledge",
      text: "Astronomical observations using advanced high-resolution spectroscopy have revealed unique chemical anomalies in the atmospheres of distant exoplanets orbiting binary star systems. Spectroscopic data suggests the presence of vaporized heavy metals, including titanium and iron, alongside traces of water vapor and methane. Interpreting these complex atmospheric signatures requires sophisticated computational models that simulate extreme thermal dynamics and radiative transfer processes under intense stellar radiation. These breakthroughs significantly enhance our empirical understanding of planetary formation and the overall habitability of outer solar systems.",
    },
  ],
};
