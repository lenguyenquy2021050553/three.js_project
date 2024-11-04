import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';

let scene1, scene2, scene3, scene4, currentScene;
let camera, renderer, raycaster, mouse, composer, outlinePass;
let highlightedObject = null; // Đối tượng đang được làm sáng
const infoElement = document.createElement('div'); // Tạo phần tử hiển thị thông tin

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
scene1.background = new THREE.Color(0x989898);
scene2 = new THREE.Scene();
scene2.background = new THREE.Color(0x989898);
scene3 = new THREE.Scene();
scene3.background = new THREE.Color(0x989898);
scene4 = new THREE.Scene();
scene4.background = new THREE.Color(0x989898);

currentScene = scene1;

// Thêm ánh sáng mạnh vào tất cả các scene
function addLightingToScene(scene) {
    let directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    let pointLight = new THREE.PointLight(0xffffff, 2, 50);
    pointLight.position.set(0, 5, 5);
    scene.add(pointLight);

    let ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);
}

// Thêm ánh sáng vào từng scene
addLightingToScene(scene1);
addLightingToScene(scene2);
addLightingToScene(scene3);
addLightingToScene(scene4);

// Khởi tạo Raycaster và Mouse
raycaster = new THREE.Raycaster();
mouse = new THREE.Vector2();

// Khởi tạo EffectComposer và OutlinePass
composer = new EffectComposer(renderer);
outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), currentScene, camera);
const renderPass = new RenderPass(currentScene, camera);
composer.addPass(renderPass);
composer.addPass(outlinePass);

const fxaaPass = new ShaderPass(FXAAShader);
fxaaPass.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight);
composer.addPass(fxaaPass);

// Tạo phần tử hiển thị thông tin
infoElement.style.position = 'absolute';
infoElement.style.padding = '8px';
infoElement.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
infoElement.style.border = '1px solid #ccc';
infoElement.style.display = 'none'; // Ẩn mặc định
infoElement.style.maxWidth = '200px'; // Giới hạn chiều rộng tối đa để xuống dòng
infoElement.style.wordWrap = 'break-word'; // Cho phép xuống dòng khi văn bản dài

document.body.appendChild(infoElement);


// Hàm cập nhật composer khi chuyển scene
function updateComposer() {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(currentScene, camera));
    outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), currentScene, camera);
    composer.addPass(outlinePass);
    composer.addPass(fxaaPass);
}

// Hàm tải mô hình GLTF vào scene
const loader = new GLTFLoader();
loader.load('./assets/tree.glb', function (gltf) {
    let model = gltf.scene;
    model.position.set(0, 0, 0);
    scene1.add(model);
});
loader.load('./assets/root.glb', function (gltf) {
    let model = gltf.scene;
    model.position.set(0, 0, 0);
    scene2.add(model);
});
loader.load('./assets/stem.glb', function (gltf) {
    let model = gltf.scene;
    model.position.set(0, 0, 0);
    scene3.add(model);
});
loader.load('./assets/leaf.glb', function (gltf) {
    let model = gltf.scene;
    model.position.set(0, 0, 0);
    scene4.add(model);

    // Tìm các đối tượng tế bào lá, mạch gỗ và khí khổng
    const xylem = model.getObjectByName('xylem');
    const leafCell = model.getObjectByName('leaf_cell');
    const khiKhong = model.getObjectByName('khi_khong');

    // Gọi hàm tạo phân tử nước và phân tử đường
    animateWaterDroplets(xylem.position, leafCell.position, khiKhong.position);
    animateSugarMolecules(leafCell.position, xylem.position);

    // Lưu các đối tượng vào một mảng để kiểm tra với Raycaster
    const interactableObjects = [leafCell, xylem, khiKhong];

    // Sự kiện di chuyển chuột
    // Sự kiện di chuyển chuột
    window.addEventListener('mousemove', (event) => {
        // Chỉ xử lý nếu đang ở scene4
        if (currentScene === scene4) {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(interactableObjects);

            if (intersects.length > 0) {
                if (highlightedObject !== intersects[0].object) {
                    highlightedObject = intersects[0].object;
                    outlinePass.selectedObjects = [highlightedObject];

                    // Hiển thị thông tin
                    infoElement.style.display = 'block';
                    infoElement.style.left = `${event.clientX + 10}px`;
                    infoElement.style.top = `${event.clientY + 10}px`;

                    if (highlightedObject === leafCell) {
                        infoElement.innerText = 'Tế bào thực vật là tế bào nhân thực có ở cây xanh, sinh vật nhân thực quang hợp thuộc giới Plantae. Đặc điểm nổi bật của chúng bao gồm các vách tế bào tiểu chứa cellulose, các hemicellulose và pectin, sự hiện diện của plastid với khả năng để thực hiện quá trình quang hợp và lưu trữ tinh bột.';
                    } else if (highlightedObject === xylem) {
                        infoElement.innerText = 'Mạch bao gồm: Mạch gỗ (cũng gọi: xylem) là một loại mạch vận chuyển nước và ion khoáng ở cây trên cạn, mạch rây là một mô sống trong thực vật có mạch để vận chuyển những hợp chất hữu cơ hòa tan do quang hợp tạo ra.';
                    } else if (highlightedObject === khiKhong) {
                        infoElement.innerText = 'Khí khổng, đôi khi cũng được gọi là khí khẩu hay lỗ thở, là một loại tế bào quan trọng của thực vật (chỉ có ở thực vật trên cạn, không có ở thực vật thủy sinh).';
                    }
                }
            } else {
                highlightedObject = null;
                outlinePass.selectedObjects = [];
                infoElement.style.display = 'none'; // Ẩn thông tin
            }
        } else {
            // Ẩn thông tin nếu không phải là scene4
            highlightedObject = null;
            outlinePass.selectedObjects = [];
            infoElement.style.display = 'none';
        }
    });
});

// Tạo hình cầu cho phân tử nước
const waterGeometry = new THREE.SphereGeometry(0.05, 16, 16);
const waterMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });

// Tạo hình cầu cho phân tử đường
const sugarGeometry = new THREE.SphereGeometry(0.025, 16, 16);
const sugarMaterial = new THREE.MeshBasicMaterial({ color: 0xffa500 });

// Hàm tạo và di chuyển các phân tử nước
function createWaterDroplet(xylemPos, leafCellPos, khiKhongPos) {
    const droplet = new THREE.Mesh(waterGeometry, waterMaterial);
    droplet.position.set(xylemPos.x, xylemPos.y, xylemPos.z - 1);
    scene4.add(droplet);
    const speed = 0.02;
    let stage = 1;

    function animateDroplet() {
        if (stage === 1) {
            droplet.position.z += speed;
            if (droplet.position.z >= xylemPos.z) {
                stage = 2;
            }
        } else if (stage === 2) {
            droplet.position.z += speed;
            if (droplet.position.z >= xylemPos.z + 0.2) {
                stage = 3;
            }
        } else if (stage === 3) {
            droplet.position.lerp(leafCellPos, speed);
            if (droplet.position.distanceTo(leafCellPos) < 0.05) {
                stage = 4;
            }
        } else if (stage === 4) {
            droplet.position.lerp(khiKhongPos, speed);
            if (droplet.position.distanceTo(khiKhongPos) < 0.05) {
                scene4.remove(droplet);
                return;
            }
        }
        requestAnimationFrame(animateDroplet);
    }
    animateDroplet();
}

// Hàm tạo và di chuyển các phân tử đường
function createSugarMolecule(leafCellPos, xylemPos) {
    const sugarMolecule = new THREE.Mesh(sugarGeometry, sugarMaterial);
    sugarMolecule.position.set(leafCellPos.x, leafCellPos.y, leafCellPos.z);
    scene4.add(sugarMolecule);
    const speed = 0.01;
    let stage = 1;

    function animateSugar() {
        if (stage === 1) {
            sugarMolecule.position.z += speed;
            if (sugarMolecule.position.z >= leafCellPos.z + 0.5) {
                stage = 2;
            }
        } else if (stage === 2) {
            sugarMolecule.position.x += speed;
            if (sugarMolecule.position.x >= xylemPos.x + 0.1) {
                stage = 3;
            }
        } else if (stage === 3) {
            sugarMolecule.position.z -= speed;
            if (sugarMolecule.position.z <= xylemPos.z - 1) {
                scene4.remove(sugarMolecule);
                return;
            }
        }
        requestAnimationFrame(animateSugar);
    }
    animateSugar();
}

// Hàm gọi liên tục các phân tử nước
function animateWaterDroplets(xylemPos, leafCellPos, khiKhongPos) {
    createWaterDroplet(xylemPos, leafCellPos, khiKhongPos);
    setTimeout(() => animateWaterDroplets(xylemPos, leafCellPos, khiKhongPos), 500);
}

// Hàm gọi liên tục các phân tử đường
function animateSugarMolecules(leafCellPos, xylemPos) {
    createSugarMolecule(leafCellPos, xylemPos);
    setTimeout(() => animateSugarMolecules(leafCellPos, xylemPos), 1000);
}

// Hàm render
function animate() {
    requestAnimationFrame(animate);
    composer.render();
}

// Chuyển scene
document.getElementById('switch-btn1').addEventListener('click', function () {
    currentScene = scene1;
    updateComposer();
});
document.getElementById('switch-btn2').addEventListener('click', function () {
    currentScene = scene2;
    updateComposer();
});
document.getElementById('switch-btn3').addEventListener('click', function () {
    currentScene = scene3;
    updateComposer();
});
document.getElementById('switch-btn4').addEventListener('click', function () {
    currentScene = scene4;
    updateComposer();
});

// Bắt đầu render
animate();

// Xử lý khi thay đổi kích thước cửa sổ
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    composer.setSize(window.innerWidth, window.innerHeight);
});
