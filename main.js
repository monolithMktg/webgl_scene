import {headerScripts,animate,createTimeline,stagger, svg, utils, onScroll} from './header.js';
import {uniforms} from './src/shaders/uniforms.js';
import {vert} from './src/shaders/vert.js';
import {frag} from './src/shaders/frag.js';
import {bgVert} from './src/shaders/bgVert.js';
import {bgFrag} from './src/shaders/bgFrag.js';
import {textFrag} from './src/shaders/textFrag.js';
import {techFrag} from './src/shaders/techFrag.js';
import {gltfPlaneF} from './src/shaders/gltfPlaneF.js';

import {
  Renderer,
  Camera,
  Transform,
  TextureLoader,
  RenderTarget,
  GLTFLoader,
  Plane,
  Program,
  Mesh,
  Vec2,
  Vec3,
} from './src/ogl/index.js';

// Load scripts from header file
let scripts = new headerScripts;
let isMobile = scripts.isMobile();
let isTouch = scripts.isTouch();
let firstFrame = true;
let activateScroll = false;
let bgColumns = 50;
let lenis;
let uMove = { value: 0 };


window.addEventListener('load', () => {
  if( !isTouch ){
    lenis = new Lenis({syncTouch: true});
    lenis.stop();
    lenis.scrollTo(0,{offset: 0, immediate: true, force: true});
  } else {
    window.scrollTo(0,0);
  }

  if( isMobile ) bgColumns = 40;

  class Sketch{
    constructor(){
  
      // Vars
      this.speed = { value: 0 };
      this.enterView = { value: 0 };
      this.prevMouse = new Vec2();
      this.newMouse = new Vec2();
      this.renderGLTF = false;
      
      this.init();
    }
  
    // INIT
    init(){
      
      this.renderer = new Renderer({
        antialias: true,
        dpr: Math.min( 1.5, window.devicePixelRatio )
      });
  
      this.gl = this.renderer.gl;
      this.parent = document.querySelector('.canvas');
      this.parent.appendChild(this.gl.canvas);
  
      this.width = this.parent.offsetWidth;
      this.height = this.parent.offsetHeight;
      this.asp = this.width / this.height;
      this.renderer.setSize(this.width, this.height);
      
      this.gl.clearColor(0.1, 0.1, 0.1, 1);
      
      // Camera related
      this.distZ = 600,
      this.fov = 2*Math.atan( ( this.height/2 ) / this.distZ ) * (180 / Math.PI);
      this.camera = new Camera(this.gl, { near: .01, far: 6000, aspect: this.asp, fov: this.fov  });
      this.camera.position = new Vec3( 0, 0, this.distZ );
      this.camera.lookAt( new Vec3(0, 0, 599));
  
      // this.controls = new Orbit(this.fboCamera, { target: new Vec3(0, 0, -1)});
      this.scene = new Transform();
      
      this.getTextures();
      this.geometry();

      if( !isMobile ){
        // GLTF CAMERA
        this.gltfCamPos = new Vec3( 0.08, 0.075, 0 );
        this.gltfCamLook = new Vec3( 0, 0, 0 );
        
        if( this.asp < 1 ){
          this.fov = 70;
        } else {
          this.fov = 40;
        } 
  
        this.fboCamera = new Camera(this.gl, { near: .01, far: 10, aspect: this.asp, fov: this.fov  });
        this.fboCamera.position = this.gltfCamPos;
        this.fboCamera.lookAt( this.gltfCamLook );
        this.gltfScene = new Transform();
        
        this.loadGLTF();
      }
  
      this.programs = [];
  
      this.events();
      // this.runSVG();
      this.animate();
    
    }

    runSVG(){
        //Triggers
        let playBtn = document.querySelector('.play_svg');
        let resetBtn = document.querySelector('.reset_svg');
      
        let graphs = [...document.querySelectorAll('svg.first text tspan')];
        let cpu_usage = graphs[0];
        let gpu_usage = graphs[1];
      
        // console.log(cpu_usage,gpu_usage)
      
        // PATHS
        let [$path1, $path2] = utils.$('svg path.graph_cpu');
        let [$path3, $path4] = utils.$('svg path.graph_gpu');
      
        // Circles0
        let $circles1 = utils.$('svg.first g.graph_dots circle');
        let $circles2 = [...document.querySelectorAll('svg.second g.graph_dots circle')];
      
        // Extract the 'cy' values from the second SVG's circles
        const targetCxValues = [41.346352,69.448357,93.402817,108.21073,125.04655,136.97098,41.346352,69.448357,93.402817,108.21073,125.04655,137.25665];
        const targetCyValues = [171.12126,168.65939,168.65939,168.65939,167.61209,167.61209,168.65939,159.76817,160.71886,160.71886,159.76817,159.76817];
      
        animate('.scrollAnim_title', {
          scale: {from: 2},
          ease: 'inOutQuad',
          autoplay: onScroll({
            enter: 'bottom top',
            leave: 'top+=100 top',
            sync: 1,
            ease: 'inOutCirc',
          })
        })
      
        let toMove = [
          // Move graphs
          animate($path1, {
            d: svg.morphTo($path2),
            stroke: '#4d4d4d',
            ease: 'inOutQuad',
            autoplay: false,
            duration: 1000,
          }),
          
          animate($path3, {
            d: svg.morphTo($path4),
            stroke: '#9bf500',
            ease: 'inOutQuad',
            autoplay: false,
            duration: 1000,
          }),
      
          // Move Circles
          animate($circles1, {
            cx: (_,i) => targetCxValues[i]+0.15292104,
            cy: (_,i) => targetCyValues[i]-80.582118,
            ease: 'inOutQuad',
            autoplay: false,
            duration: 1000,
          }),
      
          // Move cpu usage text
          animate(cpu_usage, {
            x: 72,
            y: 92,
            ease: 'inOutCirc',
            autoplay: false,
            duration: 1500,
          }),
      
          // Move gpu usage text
          animate(gpu_usage, {
            x: 72,
            y: 77,
            ease: 'inOutCirc',
            autoplay: false,
            duration: 1500,
          })
          
        ];
      
        playBtn.onclick = () => {
          toMove.forEach( a => { a.play() })
        }
      
        resetBtn.onclick = () => {
          toMove.forEach( a => { a.reverse() })
        }
    }
  
    // RESIZE
    resize(){
      this.width = this.parent.offsetWidth;
      this.height = this.parent.offsetHeight;
      this.renderer.setSize(this.width, this.height);
      this.asp = this.width / this.height;
      
      // Update cameras
      this.fov = 2*Math.atan( ( this.height/2 ) / this.distZ ) * (180 / Math.PI);
      this.camera.perspective({ aspect: this.asp, fov: this.fov });

      if( !isMobile ){
        if( this.asp < 1 ){
          this.fov = 70;
        } else {
          this.fov = 40;
        } 
        this.fboCamera.perspective({ aspect: this.asp, fov: this.fov });
  
        this.hotspots.forEach( spot => {
          let bounds, w, h, l, t;
  
          if( spot.name !== 'bg' ){
            bounds = spot.el.getBoundingClientRect();
            w = bounds.width;
            h = bounds.height;
            l = bounds.left;
            t = bounds.top;
          } else {
            w = this.width;
            h = this.height;
            l = 0;
            t = 0;
          }
    
          spot.width = w;

          if(spot.name == '.quoteAnchor' || spot.name == '.glbAnchor' ||  spot.name == '.techAnchor'){
            spot.height = h;
          } else if(spot.name == '.heroAnchor') {
            spot.height = window.innerHeight;
          }
          
          spot.left = l;
          spot.top = spot.name == 'bg' ? t : t + uMove.value; // because bg plane will not move up with scroll
          
          let asp = !spot.aspect ? (w/h) / 2 : 1; // check if not video
  
          
          if( spot.name == '.glbAnchor' ){
            this.fbo.setSize( this.width, this.height );
          }
  
        });
  
        // Update positions
        this.setPosition();
      }
      
    }
  
    setPosition(){

      this.hotspots.forEach( obj => {

        // Define the bounding Left, Top, Width, Height
        let l = obj.left;
        let t = obj.top;
        let w = obj.width;
        let h = obj.height;
        let mesh = obj.mesh;

        //  bg
        // .heroAnchor
        // .techAnchor
        // .quoteAnchor
        // .glbAnchor

        obj.program.uniforms.uResolution.value = new Vec2(w,h);

        // Figure the rate of change given the fixed original size
        let changeW = w/obj.originalW;
        let changeH = h/obj.originalH;

        let scale = new Vec2(changeW, changeH);
        
        mesh.scale.set(scale.x,scale.y,1);

        if(obj.name !== 'bg') {
          // Move with scroll
          let x = -this.width/2 + (w/2) + l;
          let y = this.height/2 - (h/2 + t) + uMove.value;
          mesh.position.set(x, y, 0);
        }
        
        
      } );
    }

    // Vert, Frag, Geometry, Uniforms, Scene
    basicMaterial( v, f, g, unifs = [], s, alpha = false ){

      let uniforms = {
        uTime: this.speed,
        uResolution: { value: new Vec2( this.gl.canvas.width, this.gl.canvas.height ) },
      }

      unifs.forEach( u => {
        if( u.key == 'uMove' ){
          uniforms[u.key] = u.value
        } else {
          uniforms[u.key] = { value: [u.value] }
        }
      });
      
      let defines = `
        #define PI 3.14159265
      `;
      
      let vertPrefix = this.renderer.isWebgl2
      ? /* glsl */ `#version 300 es
        #define attribute in
        #define varying out
        #define texture2D texture`
      : ``;
  
      let fragPrefix = this.renderer.isWebgl2
      ? /* glsl */ `#version 300 es
        precision highp float;
        #define varying in
        #define texture2D texture
        #define gl_FragColor FragColor
        out vec4 FragColor;
      `
      : `
        #extension GL_OES_standard_derivatives : enable
        precision highp float;
      `;
  
      let program = new Program(this.gl, {
          vertex: vertPrefix + defines + v,
          fragment: fragPrefix + defines + f,
          uniforms,
          transparent: alpha
      });
  
      
  
      // Meshes
      let mesh = new Mesh(this.gl, { geometry: g, program });
      let scene;
      
      if( s ){
        mesh.setParent(s);
        scene = s;
      } else {
        scene = mesh
      }
  
      return { program, mesh, scene };
      
    }

    // Textures
    getTextures(){
      this.lutTexture = TextureLoader.load(this.gl, {
        src: passed_vars.root_path + './assets/src/images/lut.png',
      });
      this.envDiffuseTexture = TextureLoader.load(this.gl, {
        src: passed_vars.root_path + './assets/src/images/gardens-diffuse-RGBM.png',
      });
      this.envSpecularTexture = TextureLoader.load(this.gl, {
        src: passed_vars.root_path + './assets/src/images/gardens-specular-RGBM.png'
      });
      this.flr = TextureLoader.load(this.gl, {
        src: passed_vars.root_path + './assets/src/images/flr.webp',
        wrapS: this.gl.MIRRORED_REPEAT,
        wrapT: this.gl.MIRRORED_REPEAT
    });
    
      this.flr_ao = TextureLoader.load(this.gl, {
        src: passed_vars.root_path + './assets/src/images/flr_ao.webp',
        flipY: true,
        format: this.gl.RED,
        internalFormat: this.gl.R8,
        generateMipmaps: false,
      });

      this.tex = TextureLoader.load( this.gl, { 
        src: passed_vars.root_path + './assets/src/images/t.png' ,
        minFilter: this.gl.LINEAR,
        magFilter: this.gl.LINEAR,
      });
      
      this.techStackImg = TextureLoader.load( this.gl, { 
        src: passed_vars.root_path + './assets/src/images/t_stack.webp' ,
        minFilter: this.gl.LINEAR,
        magFilter: this.gl.LINEAR,
        wrapT: this.gl.REPEAT,
      });

      this.fbo = new RenderTarget( this.gl, { 
        width: this.width, 
        height: this.height,
        wrapS: this.gl.CLAMP_TO_EDGE,
        wrapT: this.gl.CLAMP_TO_EDGE,
        generateMipmaps: false
        } );

      this.fbo.needsUpdate = true;
    }
  
  
    // GEOMETRY
    async loadGLTF(){  
      this.gltf = await GLTFLoader.load(this.gl,
          passed_vars.root_path + './assets/src/gltf/logoScene2.glb'
      );

      this.addGLTF(this.gltf);
    }
    
    addGLTF(gltf){
      // REMOVED THIS LINE BECAUSE IT WAS NOT RENDERING THE BG PLANE
      // this.scene.children.forEach((child) => child.setParent(null));
      
      const s = gltf.scene || gltf.scenes[0];
      this.programs = [];
  
      s.forEach((root) => {
        root.setParent(this.gltfScene);
        root.traverse((node) => {
          if (node.program) {
            node.program = this.createProgram(node);
          }
        });    
      });

      this.gltfScene.rotation.y = Math.PI * 0.5;
          
    }
    
    createProgram(node) {
      const gltf = node.program.gltfMaterial || {};
  
      const vertexPrefix = this.renderer.isWebgl2
      ? /* glsl */ `#version 300 es
      #define attribute in
      #define varying out
      #define texture2D texture
      `
          : ``;
  
      const fragmentPrefix = this.renderer.isWebgl2
          ? /* glsl */ `#version 300 es
          precision highp float;
          #define varying in
          #define texture2D texture
          #define gl_FragColor FragColor
          out vec4 FragColor;
      `
          : /* glsl */ `#extension GL_OES_standard_derivatives : enable
          precision highp float;
      `;
  
      // CURTAIN INSTANCES ANIMATION OFFSETS
      if( node.geometry.isInstanced ){
        let numInstances = 6;
        let offsets = new Float32Array( numInstances );
  
        for (let i = 0; i < numInstances; i++) {
          offsets.set([Math.random() + .3], i)
        }
  
        node.geometry.addAttribute( 'aOffsets', { size: 1, instanced: 1, data: offsets });
        
      }
      
      let defines = `
        ${node.geometry.attributes.uv ? `#define UV` : ``}
        ${node.geometry.attributes.normal ? `#define NORMAL` : ``}

        ${ node.geometry.isInstanced ? `#define ISLOGOWIRES` : ``}
        ${ gltf.name == `Wire` ? `#define WIREMATERIAL` : ``}
        ${ (gltf.name == 'Floor') ? `#define ISLOGOFLOOR` : ``}
        ${ (gltf.name =='Main_logo' ) ? `#define ISLOGO` : ``}

        ${node.boneTexture ? `#define SKINNING` : ``}
        ${gltf.alphaMode === 'MASK' ? `#define ALPHA_MASK` : ``}
        ${gltf.baseColorTexture ? `#define COLOR_MAP` : ``}
        ${gltf.normalTexture ? `#define NORMAL_MAP` : ``}
        ${gltf.metallicRoughnessTexture ? `#define RM_MAP` : ``}
        ${gltf.occlusionTexture ? `#define OCC_MAP` : ``}
        ${gltf.emissiveTexture ? `#define EMISSIVE_MAP` : ``}  
      `;
  
      let vertex = vertexPrefix + defines + vert;
      let fragment = fragmentPrefix + defines + uniforms + frag;
      let lightPos = new Vec3( 1, 1, 1 );

      this.program = new Program(this.gl, {
        vertex,
        fragment,
        uniforms: {
          uTime: this.speed,
          uBaseColorFactor: { value: gltf.baseColorFactor || [1, 1, 1, 1] },
          tBaseColor: { value: [1,1,1,1] },
  
          tRM: { value: gltf.metallicRoughnessTexture ? gltf.metallicRoughnessTexture.texture : null },
          floorAO: { value: this.flr_ao },
          uRoughness: { value: gltf.roughnessFactor !== undefined ? gltf.roughnessFactor : 0.1 },
          uMetallic: { value: gltf.metallicFactor !== undefined ? gltf.metallicFactor : 1 },
  
          tNormal: { value: gltf.normalTexture ? gltf.normalTexture.texture : null },
          uNormalScale: { value: gltf.normalTexture ? gltf.normalTexture.scale || 1 : 1 },
  
          tOcclusion: { value: gltf.occlusionTexture ? gltf.occlusionTexture.texture : null },
  
          tEmissive: { value: gltf.emissiveTexture ? gltf.emissiveTexture.texture : null },
          uEmissive: { value: gltf.emissiveFactor || [0, 0, 0] },
  
          tLUT: { value: this.lutTexture },
          tEnvDiffuse: { value: this.envDiffuseTexture },
          tEnvSpecular: { value: this.envSpecularTexture },
          uEnvDiffuse: { value: 0 },
          uEnvSpecular: { value: 0.6 },

          tFloorTex: { value: (gltf.name == 'Floor' || gltf.name == 'Main_logo') ? this.flr : null },
  
          uLightDirection: { value: lightPos },
          uLightColor: { value: new Vec3( 0 ) },
  
          uAlpha: { value: 1 },
          uAlphaCutoff: { value: gltf.alphaCutoff },
        },
        // transparent: gltf.alphaMode === 'BLEND',
        cullFace: null,
      });
  
      this.programs.push( this.program );
  
      return this.program;
    }
  

    geometry(){

      if( !isMobile ){
        let mouse = new Vec2();
        let isDesktop = 0;
        if(!isTouch) {
          mouse = this.prevMouse;
          isDesktop = 1;
        };

        
        //////////////////////////// Define hotspots /////////////////////////////////////////
  
        let objects = [
            {
                name: '.heroAnchor',
                vert: bgVert,
                frag: textFrag,
                texture: this.tex,
                alpha: true,
                scene: this.scene,
                aspect: false
            },
            {
                name: '.techAnchor',
                vert: bgVert,
                frag: techFrag,
                texture: this.techStackImg,
                alpha: true,
                scene: this.scene,
                aspect: true
            },
            {
                name: '.quoteAnchor', // "People absorb visuals...
                vert: bgVert,
                frag: textFrag,
                texture: this.tex,
                alpha: true,
                scene: this.scene,
                aspect: false
            },
            {
                name: '.glbAnchor',
                vert: bgVert,
                frag: gltfPlaneF,
                texture: this.fbo.texture,
                alpha: false,
                scene: this.scene,
                aspect: false
            },
            {
                name: 'bg', // for translating the plane to -3 on z-axis and dimensions
                vert: bgVert,
                frag: bgFrag,
                texture: '',
                alpha: false,
                scene: this.scene,
                aspect: false
            }
        ];
        
        this.hotspots = [];
        
        objects.forEach( (spot,idx) => {
            let el, l, t,originalW, originalH, w, h, asp, mesh;
        
            if( spot.name !== 'bg' ){
        
                el = document.querySelector(spot.name);
                let bounds = el.getBoundingClientRect();
                l = bounds.left; // Left
                t = bounds.top; // Top
                w = originalW = bounds.width; // Width
                h = originalH = bounds.height; // Height
                asp = !spot.aspect ? (w/h) / 2 : 1;
  
                if( spot.name == '.glbAnchor' ){
                  asp = w/h;
                }
        
                // PLANES
                let plane = new Plane( this.gl, {
                    width: w,
                    height: h
                });
  
                let uniforms = [
                  { key: 'uTex', value: spot.texture },
                  { key: 'uMove', value: uMove },
                  { key: 'mouseOver', value: 0 },
                  { key: 'uAsp', value: asp }    
                ];
                
  
                if( idx == 1 ) uniforms.push( { key: 'uNoise', value: this.flr } );
  
                if( spot.name == '.heroAnchor' ){
                  uniforms.push( { key: 'uIndex', value: 0 }, { key: 'uEnter', value: 0 } );
                } else if( spot.name == '.quoteAnchor' ){
                  uniforms.push( { key: 'uIndex', value: 1 }, { key: 'uEnter', value: 0 } );
                }
        
                mesh = this.basicMaterial( spot.vert, spot.frag, plane, uniforms, spot.scene, spot.alpha );
  
  
                mesh.mesh.frustumCulled = false
        
            } else {
                l = 0;
                t = 0;
                w = originalW = this.width;
                h = originalH = this.height;
                asp = w/h;
  
                let plane = new Plane( this.gl, {
                  width: w,
                  height: h
                });

                mesh = this.basicMaterial( spot.vert, spot.frag, plane, [
                    { key: 'uMove', value: uMove },
                    { key: 'uMouse', value: mouse },
                    { key: 'uAsp', value: this.asp },
                    { key: 'uDesktop', value: isDesktop },
                    { key: 'uSpeed', value: 1 },
                    { key: 'uColumns', value: bgColumns },
                  ], spot.scene);
          
                mesh.mesh.position.z = -3;
                // just a magic number because moving it to -1 or even -2 wouldnt show the transparent text planes that are at 0 on z-axis. Maybe a precision issue.
            }
        
            this.hotspots.push(
                {
                    name: spot.name,
                    el,
                    left: l,
                    top: t,
                    width: w,
                    height: h,
                    originalW,
                    originalH,
                    mesh: mesh.mesh,
                    program: mesh.program
                }
            )
        })
        
        this.setPosition();

      } else {
        let originalW;
        let originalH;
        let l = 0;
        let t = 0;
        let w = originalW = this.width;
        let h = originalH = this.height;
        let asp = w/h;

        let plane = new Plane( this.gl, {
          width: w,
          height: h
      });

        this.bgMesh = this.basicMaterial( bgVert, bgFrag, plane, [
            { key: 'uMove', value: uMove },
            { key: 'uAsp', value: asp },
            { key: 'uSpeed', value: 1 },
            { key: 'uMouse', value: 0 },
            { key: 'uDesktop', value: 0 },
            { key: 'uColumns', value: bgColumns },
          ], this.scene);
  
        // -3 is just a magic number because moving it to -1 or even -2 wouldnt show the transparent text planes that are at 0 on z-axis. Maybe a precision issue.
        this.bgMesh.mesh.position.z = -3;
      }
      
    }

    activateElements(scroll){

      // Pass activation value for text distortion easing - "People absorb..."
      if( scroll > this.hotspots[2].top - (window.innerHeight * 0.3) ){
        animate(this.enterView,{
          value: 1,
          duration: 1000,
          ease: 'outCubic'
      });

        this.hotspots[2].program.uniforms.uEnter.value = this.enterView.value;
      }

      // Enable GLTF scene only when in view and pass mouse coords for interactivity
      if( scroll > this.hotspots[3].top - window.innerHeight ){
        this.renderGLTF = true;

        document.onmousemove = (e) => {
          let x = (e.clientX / window.innerWidth) * 2 - 1;
          let y = (e.clientY / window.innerHeight) * 2 - 1;
          
          this.gltfScene.rotation.x = Math.min(0.2, .05 * y);
          this.gltfScene.rotation.y = Math.PI * .5 + Math.min(0.2, .05 * x);
        }
      } else {
        this.renderGLTF = false;
      }
      
    }
  
    // EVENTS
    events(){
      document.addEventListener('click', () => {})

      if( !isMobile )  {
        
        if( !isTouch ){
          lenis.on( 'scroll', (e) => {
            uMove.value = e.animatedScroll;
            this.activateElements(e.animatedScroll);          
          });

          document.addEventListener('mousemove', (e) => {
            // console.log(this.hotspots[4].program.uniforms);
    
            this.newMouse.x = (e.clientX/window.innerWidth);
            this.newMouse.y = 1 - (e.clientY/window.innerHeight);
    
          })


        } else {
          document.addEventListener('scroll', ()=>{            
            uMove.value = window.scrollY;
            this.activateElements(window.scrollY);
          })
        }

      } else{
        document.addEventListener('scroll', ()=>{            
          uMove.value = window.scrollY;
        })
      }

      window.addEventListener('resize', this.resize.bind(this) );

    }
    
    // ANIMATE
    animate(time){

      // UPDATING VALUES
      this.speed.value += 0.005;

      
      if( firstFrame && this.speed.value > 0.3 ){
        firstFrame = !firstFrame;        
        if( document.querySelector('.preload_wrapper') ) scripts.loadPreloader();
        if( !isMobile ) this.renderer.render({ scene: this.gltfScene, camera: this.fboCamera, target: this.fbo });
      }
      

      // Speed down anim on page reload
      if( scripts.finished ){

        animate(!isMobile ? this.hotspots[4].program.uniforms.uSpeed : this.bgMesh.program.uniforms.uSpeed,{
          value: 0,
          duration: 1500,
          loop: false
        })

        // RENDERING LOGIC
        if( !isMobile ){

          // Run tablet and desktop script
          if( this.renderGLTF ){
            this.renderer.render({ scene: this.gltfScene, camera: this.fboCamera, target: this.fbo });
            this.hotspots[3].program.uniforms.uTex.value = this.fbo.texture; // GLTF
          }
          this.setPosition();

          // Pure desktop scripts
          if( !isTouch ){
            if( !activateScroll ){
              activateScroll = true;
              lenis.start();
            }
            lenis.raf(time);
  
            // BG mouse interactivity only on desktop
            this.prevMouse = this.prevMouse.lerp(this.newMouse, 0.04);
            this.hotspots[4].program.uniforms.uMouse.value = this.prevMouse;
          }
        }

      }    
      
      
      this.renderer.render({ scene: this.scene, camera: this.camera });
      
      
      // if( this.controls) this.controls.update();
      // Only uncomment below line to render and debung only the gltf plane. For this, comment out the 3 rendering logic lines above
      // this.renderer.render({ scene: this.gltfScene, camera: this.fboCamera });
      requestAnimationFrame(this.animate.bind(this))
  
    }
  
  }
  
  new Sketch;
})
