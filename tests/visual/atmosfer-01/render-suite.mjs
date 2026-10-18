import{spawn}from'node:child_process';
for(const args of [ ['capture.mjs','--mode=raster'],['capture.mjs','--mode=path','--backend=vulkan','--width=800','--height=534','--samples=16'],['browser-check.mjs']]){
 const code=await new Promise(resolve=>spawn(process.execPath,[`tests/visual/atmosfer-01/${args[0]}`,...args.slice(1)],{stdio:'inherit',env:process.env}).on('exit',resolve));if(code)process.exit(code);
}
