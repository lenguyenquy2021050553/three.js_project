import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';

let scene1, scene2, scene3, scene4, currentScene;
    let camera, renderer;

    // Khởi tạo renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Khởi tạo camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 2;
    camera.position.y = 2;


    // Khởi tạo controls orbit
    let controls = new OrbitControls(camera, renderer.domElement);
    controls.update();
    
    // Khởi tạo các scene và ánh sáng
    scene1 = new THREE.Scene();
    scene1.background = new THREE.Color(0x808080); 
    scene2 = new THREE.Scene();
    scene2.background = new THREE.Color(0x808080); 
    scene3 = new THREE.Scene();
    scene3.background = new THREE.Color(0x808080); 
    scene4 = new THREE.Scene();
    scene4.background = new THREE.Color(0x808080); 

    let ambientLight1 = new THREE.AmbientLight(0xffffff, 1);
    let ambientLight2 = new THREE.AmbientLight(0xffffff, 1);
    let ambientLight3 = new THREE.AmbientLight(0xffffff, 1);
    let ambientLight4 = new THREE.AmbientLight(0xffffff, 1);

    scene1.add(ambientLight1);
    scene2.add(ambientLight2);
    scene3.add(ambientLight3);
    scene4.add(ambientLight4);

    // Hàm tải mô hình GLTF vào scene
    const loader = new GLTFLoader();

    loader.load('./assets/tree.glb', function(gltf) {
        let model = gltf.scene;
        model.position.set(0, 0, 0);
        scene1.add(model);
    });

    loader.load('./assets/root.glb', function(gltf) {
        let model = gltf.scene;
        model.position.set(0, 0, 0);
        scene2.add(model);
    });

    loader.load('./assets/stem.glb', function(gltf) {
        let model = gltf.scene;
        model.position.set(0, 0, 0);
        scene3.add(model);
    });

    loader.load('./assets/leaf.glb', function(gltf) {
        let model = gltf.scene;
        model.position.set(0, 0, 0);
        scene4.add(model);
    });

    // Scene hiện tại
    currentScene = scene1;

    // Hàm render
    function animate() {
        requestAnimationFrame(animate);
        renderer.render(currentScene, camera);
    }

    // Hàm chuyển scene
    document.getElementById('switch-btn1').addEventListener('click', function() {
        currentScene = scene1;
    });

    document.getElementById('switch-btn2').addEventListener('click', function() {
        currentScene = scene2;
    });

    document.getElementById('switch-btn3').addEventListener('click', function() {
        currentScene = scene3;
    });

    document.getElementById('switch-btn4').addEventListener('click', function() {
        currentScene = scene4;
    });

    // Bắt đầu render
    animate();

    // Xử lý khi thay đổi kích thước cửa sổ
    window.addEventListener('resize', () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    });