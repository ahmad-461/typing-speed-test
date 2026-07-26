export interface Passage {
  id: string;
  text: string;
}

export interface PassageBank {
  easy: Passage[];
  medium: Passage[];
  hard: Passage[];
}

export const passageBank: PassageBank = {
  easy: [
    {
      id: "easy-1",
      text: "The beautiful blue bird sat on a tall green tree branch. It sang a happy little song in the warm morning sun. Many children stopped to watch it.",
    },
    {
      id: "easy-2",
      text: "Reading a good book on a rainy day is very peaceful. You can sit by the window with a hot cup of tea and forget about everything else.",
    },
    {
      id: "easy-3",
      text: "The golden retriever loved to run and catch the yellow tennis ball. He would bring it back with a happy tail wag, waiting for another throw.",
    },
    {
      id: "easy-4",
      text: "A fresh cup of coffee in the morning helps to start the day right. The rich aroma fills the kitchen as the birds begin to chirp outside.",
    },
  ],
  medium: [
    {
      id: "medium-1",
      text: "Learning to code represents a profound journey of discovery and constant problem solving. Writing high quality code requires patience, focus, and a willingness to learn from your mistakes. Every error message is not a setback, but rather a guidepost pointing towards a better solution. Practice daily and watch your professional development flourish rapidly over time.",
    },
    {
      id: "medium-2",
      text: "Technology has completely transformed the way we communicate and collaborate with colleagues across the globe. Today, we can share complex files, brainstorm ideas, and build impressive products together without ever meeting in person. However, maintaining clear and empathetic communication remains key to a successful team, regardless of the tools or platforms being utilized.",
    },
    {
      id: "medium-3",
      text: "The art of writing requires clear thinking and consistent discipline to convey complex ideas simply. Authors often spend hours editing and rewriting a single paragraph to ensure every word serves a distinct purpose. It is through this rigorous process of refinement that beautiful stories are shaped and memorable characters are brought to life for readers to enjoy.",
    },
  ],
  hard: [
    {
      id: "hard-1",
      text: "Implementing critical concurrent algorithms requires synchronization primitives to carefully avoid complex race conditions. Developers must thoroughly analyze memory structures, operational complexities, and potential deadlocks when writing highly distributed microservices. Optimization, although vital, must not precede clarity in software architecture; asynchronous interfaces demand rigorous telemetry and debugging protocols. Furthermore, multi-threaded execution environments frequently expose subtle synchronization anomalies that are exceptionally challenging to diagnose without comprehensive diagnostic logging and sophisticated profiling utilities.",
    },
    {
      id: "hard-2",
      text: "Philosophical paradigms surrounding cognitive science often query whether artificial neural networks can possess genuine subjective consciousness or semantic comprehension. While modern deep learning architectures demonstrate remarkable capabilities in pattern recognition and linguistic synthesis, they operate primarily through statistical correlations rather than conceptual introspection. Consequently, the ontological gap between computational simulation and actual cognitive awareness remains a highly debated topic among leading contemporary scholars. Investigating these complex epistemological boundaries requires interdisciplinary cooperation between neuroscience, computer engineering, and theoretical philosophy.",
    },
    {
      id: "hard-3",
      text: "Astronomical observations using advanced high-resolution spectroscopy have revealed unique chemical anomalies in the atmospheres of distant exoplanets orbiting binary star systems. Spectroscopic data suggests the presence of vaporized heavy metals, including titanium and iron, alongside traces of water vapor and methane. Interpreting these complex atmospheric signatures requires sophisticated computational models that simulate extreme thermal dynamics and radiative transfer processes under intense stellar radiation. These breakthroughs significantly enhance our empirical understanding of planetary formation and the overall habitability of outer solar systems.",
    },
  ],
};
