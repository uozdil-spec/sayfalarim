# builds pergel.mcpb (a zip) from manifest.json, icon.png and server/
import zipfile, os
here=os.path.dirname(os.path.abspath(__file__))
with zipfile.ZipFile(os.path.join(here,'pergel.mcpb'),'w',zipfile.ZIP_DEFLATED) as z:
    for f in ['manifest.json','icon.png','server/index.js','server/help.js']:
        z.write(os.path.join(here,f),f)
print('ok')
