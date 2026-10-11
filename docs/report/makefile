.DEFAULT_GOAL := all

.PHONY: all diagrams report

diagrams: 
	d2 diagrams/aws.d2 -t 0 diagrams/aws.png
	d2 diagrams/stepbystep.d2 -t 0 diagrams/stepbystep.png
	d2 diagrams/erd.d2 -t 0 diagrams/erd.png

report: diagrams
	typst compile main.typ

all: report diagrams