from app.ai.summarizer import _generate

test_text = "The mitochondria are double-membrane-bound organelles found in the cytoplasm of eukaryotic cells. They generate most of the cell's supply of adenosine triphosphate (ATP), used as a source of chemical energy. Mitochondria contain their own circular DNA and ribosomes, supporting the endosymbiotic theory of their bacterial origin."

result = _generate("SUMMARIZE", test_text)
print(result)