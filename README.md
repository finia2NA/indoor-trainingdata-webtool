# Indoor training data generator webtool
![](sourceimages/1.png)

A web based tool to generate image-pose-pair training data for training neural networks.  
Optionally, offset pose pairs can be generated for training a relative localization task.  
You can load a .glft model of an indoor scene, map out areas to generate poses, and generate poses based on many changeable parameters.  
Supports multiple projects, and multiple 3D models per project.  
Models, settings and polygons are persisted locally using a mix of localstorage and indexedDB.

The tool is written using React+Vite+Typescript.
Additional core technology is threejs, react-three-fiber, dexie, zustand and a bit of jotai.

`npm run dev` to run a development server, `npm run build` to build a deployable version.

It outputs a .zip containing screenshots
