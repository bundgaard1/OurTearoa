
#let project-report(  title: "Project Title",
  subtitle: none,
  date: none,
  authors: (),
  bibliography: none,
  appendix: none,
  header: none,
  body
) = {
  // Page setup & geometry
  set page(
    paper: "a4",
    margin: (x: 2.5cm, top: 3cm, bottom: 3cm),
    numbering: "1 / 1", // Simple clean page numbering
    header: context {
      if counter(page).get().first() > 1 [
        #header
      ]
    }
  )

  // Typography - using your preference
  set text(font: "New Computer Modern", size: 11pt, lang: "en")
  set par(justify: true, leading: 0.65em)
  
  // Left-aligned, numbered headings with clean spacing
  set heading(numbering: "1.1.")
  show heading: it => block(below: 1em, above: 1.5em)[
    #set text(weight: "bold", fill: rgb("#1a1f63"))
    #if it.numbering != none {
      counter(heading).display(it.numbering)
      h(0.5em)
    }
    #it.body
  ]

  // Figure setup for diagrams/tables
  // set figure(placement: auto)
  show figure.caption: set text(size: 9pt, style: "italic")
  
  // Code block styling (crucial for software architecture)
  show raw: set text(font: "New Computer Modern")
  show raw.where(block: true): it => block(
    fill: rgb("#f8f9fa"),
    inset: 10pt,
    radius: 4pt,
    stroke: 0.5pt + rgb("#e9ecef"),
    width: 100%,
    it
  )

  // Title block layout
  v(2cm)
  text(size: 22pt, weight: "bold")[#title]
  if subtitle != none {
    v(-8pt)
    text(size: 16pt, weight: "medium", fill: gray.darken(50%))[#subtitle]
  }
  if date != none {
    v(-4pt)
    text(size: 12pt, weight: "medium", fill: gray.darken(50%))[#date]
  }

  // Meta information / Authors grid
  grid(
    columns: (1fr, 1fr),
    gutter: 1.5cm,
    ..authors.map(auth => [
      *#auth.name* \
      #if "department" in auth [#auth.department \ ]
      #if "organization" in auth [#auth.organization \ ]
      #if "email" in auth [#link("mailto:" + auth.email)[#text(size: 10pt, fill: blue.darken(20%))[#auth.email]]]
    ])
  )

  line(length: 100%, stroke: 0.5pt + gray)


  // Document Content
  body

  // Style bibliography.
  // show std.bibliography: set text(8pt)
  // show std.bibliography: set block(spacing: 0.5em)
  set std.bibliography(title: [References], style: "ieee")

  bibliography
 
  if appendix != none {
    set heading(numbering: none) 

    // Reset counters so Appendix figures/equations start from 1 (prefixed with A)
    counter(math.equation).update(0)
    set math.equation(numbering: "(A.1)")
    
    counter(figure.where(kind: image)).update(0)
    counter(figure.where(kind: table)).update(0)

    pagebreak()
    
    appendix
  }

}
