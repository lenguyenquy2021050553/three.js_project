import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { TextureLoader } from 'three';
import * as dat from 'dat.gui';

let scene1, scene2, scene3, scene4, scene5, currentScene;
let camera, renderer, raycaster, mouse, composer, outlinePass;
let highlightedObject = null;
const infoElement = document.createElement('div');
let leafModel; // Để lưu mô hình leaf.glb

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
// Khởi tạo Dat.GUI
const gui = new dat.GUI();
gui.domElement.style.position = 'fixed';
gui.domElement.style.right = '20px'; // Khoảng cách từ bên phải
gui.domElement.style.top = '50%'; // Giữa màn hình theo chiều dọc
gui.domElement.style.transform = 'translateY(-50%)'; // Căn giữa chính xác
// Tham số để điều chỉnh số lượng nước
const params = {
    interval: 500, // Thời gian mặc định (ms)
};
// Thêm thanh điều khiển vào GUI
gui.add(params, 'interval', 0, 1000).step(100).name('Thời gian (ms)');

// Khởi tạo các scene và ánh sáng
scene1 = new THREE.Scene();
scene2 = new THREE.Scene();
scene3 = new THREE.Scene();
scene4 = new THREE.Scene();
scene5 = new THREE.Scene();
[scene1, scene2, scene3, scene4, scene5].forEach(scene => scene.background = new THREE.Color('rgba(55, 127, 185, 0.85)'));
currentScene = scene1;

// Khởi tạo TextureLoader
const textureLoader = new TextureLoader();
// Tải texture cho phân tử nước
const waterTexture = textureLoader.load('./assets/water.jpg');
// Tải texture cho phân tử đường
const sugarTexture = textureLoader.load('./assets/sugar.jpg');
//tải texture cho khói
const smokeTexture = textureLoader.load('./assets/water-vapor.jpg');
// Tải texture từ tệp 'arrows.png'
const arrowTexture = new THREE.TextureLoader().load('./assets/arrows.jpg');

// Tạo hình cầu cho phân tử nước
const waterGeometry = new THREE.SphereGeometry(0.05, 16, 16);
const waterMaterial = new THREE.MeshBasicMaterial({ map: waterTexture });

// Tạo hình cầu cho phân tử đường
const sugarGeometry = new THREE.SphereGeometry(0.025, 16, 16);
const sugarMaterial = new THREE.MeshBasicMaterial({ map: sugarTexture });

// Geometry và material cho phân tử nước tại scene2
const waterGeometryScene2 = new THREE.SphereGeometry(0.01, 16, 16);
const waterMaterialScene2 = new THREE.MeshBasicMaterial({ map: waterTexture });

// Thêm ánh sáng vào từng scene
function addLightingToScene(scene) {
    let directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    let pointLight = new THREE.PointLight(0xffffff, 2, 50);
    pointLight.position.set(0, 5, 5);
    scene.add(pointLight);

    let ambientLight = new THREE.AmbientLight(0xffffff, 4.5);
    scene.add(ambientLight);
}

[scene1, scene2, scene3, scene4, scene5].forEach(addLightingToScene);

// Khởi tạo Raycaster và Mouse
raycaster = new THREE.Raycaster();
mouse = new THREE.Vector2();

// Khởi tạo EffectComposer và OutlinePass
composer = new EffectComposer(renderer);//Hiệu ứng hậu kỳ 
outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), currentScene, camera);//hiệu ứng viền
const renderPass = new RenderPass(currentScene, camera);
composer.addPass(renderPass);
composer.addPass(outlinePass);

const fxaaPass = new ShaderPass(FXAAShader);//khử răng cưa
fxaaPass.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight);
composer.addPass(fxaaPass);

// Tạo phần tử hiển thị thông tin
infoElement.style.position = 'absolute';
infoElement.style.padding = '8px';
infoElement.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
infoElement.style.border = '1px solid #ccc';
infoElement.style.display = 'none';
infoElement.style.maxWidth = '400px';
infoElement.style.wordWrap = 'break-word';
infoElement.style.fontSize = '20px';
infoElement.style.height = 'auto';  // Đặt chiều cao cố định cho bảng (có thể điều chỉnh theo nhu cầu)
document.body.appendChild(infoElement);

// Lấy tham chiếu đến các nút Toggle Water Path và Toggle Sugar Path
const toggleWaterPathBtn = document.getElementById('toggleWaterPath');
const toggleSugarPathBtn = document.getElementById('toggleSugarPath');

// Hàm cập nhật hiển thị các nút Toggle dựa trên scene hiện tại
function updateToggleButtonVisibility() {
    if (currentScene === scene5) {
        toggleWaterPathBtn.style.display = 'inline-block';
        toggleSugarPathBtn.style.display = 'inline-block';
    } else {
        toggleWaterPathBtn.style.display = 'none';
        toggleSugarPathBtn.style.display = 'none';
    }
}

// Hàm cập nhật composer khi chuyển scene
function updateComposer() {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(currentScene, camera));
  
    outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), currentScene, camera);
    composer.addPass(outlinePass);
  
    const fxaaPass = new ShaderPass(FXAAShader);
    fxaaPass.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight);//cung cấp giá trị đầu vào cho độ phân giải
    composer.addPass(fxaaPass);
  
    // Clear existing lines
    const lines = currentScene.children.filter(child => child.type === 'Line');//lọc tìm và xóa đường Line
    lines.forEach(line => currentScene.remove(line));
  
    // Reset selected objects each time composer is updated
    outlinePass.selectedObjects = []; 
    infoElement.style.display = 'none';

    updateToggleButtonVisibility();
  }

// Khởi tạo geometry và material cho đường thẳng
let line;
const lineMaterial = new THREE.LineBasicMaterial({
    color: 0xff0000, // Màu đỏ
    linewidth: 10,    // Độ dày
    opacity: 1,      // Không trong suốt
    transparent: false
});

// Hàm vẽ đường thẳng từ đối tượng được chọn đến infoElement
function drawLineToInfoElement(object) {
    if (line) currentScene.remove(line);

    if (object && infoElement.style.display !== 'none') {// kiểm tra Line có tồn tại không , nếu ẩn ko cần vẽ
        const objectPosition = new THREE.Vector3();
        object.getWorldPosition(objectPosition);

        const infoElementPosition = new THREE.Vector3(
            (infoElement.offsetLeft / window.innerWidth) * 2 - 1,
            -(infoElement.offsetTop / window.innerHeight) * 2 + 1,
            0
        );

        infoElementPosition.unproject(camera);//chuyển tọa độ sang ko gian thế giới

        const points = [objectPosition, infoElementPosition];
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
        line = new THREE.Line(lineGeometry, lineMaterial);
        currentScene.add(line);
    }
}

// Hàm tải mô hình GLTF vào scene
const loader = new GLTFLoader();
loader.load('./assets/tree.glb', function (gltf) {
    let model = gltf.scene;
    model.position.set(0, 0, 0);
    scene1.add(model);

    // Tìm các đối tượng cần tương tác trong scene1
    const leaves = model.getObjectByName('leaves');
    const stem = model.getObjectByName('stem');
    const roots = model.getObjectByName('roots');

    const interactableObjects = [leaves, stem, roots];

    // Sự kiện click vào các đối tượng trong scene1 để chuyển sang scene tiếp theo
    window.addEventListener('click', (event) => {
        if (currentScene === scene1) { // Kiểm tra nếu đang ở scene1
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            raycaster.setFromCamera(mouse, camera);//tia ray từ chuột qua camera

            // Kiểm tra xem có click vào leaves, stem, hay roots không
            const intersects = raycaster.intersectObjects(interactableObjects);
            if (intersects.length > 0) {
                const clickedObject = intersects[0].object;

                // Chuyển sang scene2 khi click vào roots, scene3 khi click vào stem, scene4 khi click vào leaves
                if (clickedObject === leaves) {
                    currentScene = scene4;
                    updateComposer();
                } else if (clickedObject === stem) {
                    currentScene = scene3;
                    updateComposer();
                } else if (clickedObject === roots) {
                    currentScene = scene2;
                    updateComposer();
                }

            }
        }
    });

    // Sự kiện di chuyển chuột cho scene1
    window.addEventListener('mousemove', (event) => {
        if (currentScene === scene1) {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            raycaster.setFromCamera(mouse, camera);

            const intersects = raycaster.intersectObjects(interactableObjects);
            if (intersects.length > 0) {// kiểm tra có ddooois tượng bị click ko
                const hoverObject = intersects[0].object;//lấy object đầu tiên đc click

                // Hiển thị thông tin cho đối tượng hover
                if (highlightedObject !== hoverObject) {
                    highlightedObject = hoverObject;
                    outlinePass.selectedObjects = [highlightedObject];
                    infoElement.style.display = 'block';
                    infoElement.style.left = `${event.clientX + 10}px`;
                    infoElement.style.top = `${event.clientY + 10}px`;

                    if (highlightedObject === leaves) {
                        infoElement.innerText = 'Lá.';
                    } else if (highlightedObject === stem) {
                        infoElement.innerText = 'Thân.';
                    } else if (highlightedObject === roots) {
                        infoElement.innerText = 'Rễ.';
                    }
                    drawLineToInfoElement(highlightedObject);
                }
            } else {
                highlightedObject = null;
                outlinePass.selectedObjects = [];
                infoElement.style.display = 'none';
                if (line) currentScene.remove(line);
            }
        }
    });
});

loader.load('./assets/root1.glb', function (gltf) {
    let model = gltf.scene;
    model.position.set(0, 0, 0); // Đặt vị trí của mô hình
    scene2.add(model);

    // Tìm các đối tượng trong scene2
    const daiCaspary = model.getObjectByName('dai_caspary');
    const dai = model.getObjectByName('dai');
    const gianBao1 = model.getObjectByName('gian_bao1');
    const gianBao2 = model.getObjectByName('gian_bao2');
    const gianBao3 = model.getObjectByName('gian_bao3');
    const longHut = model.getObjectByName('long_hut');
    const machGo = model.getObjectByName('mach_go');
    const mach = model.getObjectByName('mach');
    const teBaoChat1 = model.getObjectByName('te_bao_chat1');
    const teBaoChat2 = model.getObjectByName('te_bao_chat2');
    const than = model.getObjectByName('than');

    // Danh sách các đối tượng tương tác
    const interactableObjects = [
        daiCaspary, gianBao1, gianBao2, gianBao3, longHut,
        machGo, teBaoChat1, teBaoChat2, than,
    ];

    // Hàm tạo và di chuyển phân tử nước qua con đường gian bào
function createWaterMoleculeGianBao(longHutPos, gianBaoPos, daiCasparyPos, machGoPos) {
    const waterMolecule = new THREE.Mesh(waterGeometryScene2, waterMaterialScene2);
    waterMolecule.position.set(longHutPos.x, longHutPos.y, longHutPos.z + 0.2); // Bắt đầu cách lông hút 1 đoạn theo trục z
    scene2.add(waterMolecule);

    const speed = 0.01;
    let stage = 0;

    function animateWaterGianBao() {
        if (stage === 0) {
            // Di chuyển tới lông hút
            waterMolecule.position.z -= speed;
            if (waterMolecule.position.z <= longHutPos.z) stage = 1;
        } else if (stage > 0 && stage <= gianBaoPos.length) {
            // Di chuyển qua các điểm gian bào
            waterMolecule.position.lerp(gianBaoPos[stage - 1], speed);
            if (waterMolecule.position.distanceTo(gianBaoPos[stage - 1]) < 0.01) stage++;
        } else if (stage === gianBaoPos.length + 1) {
            // Đi tới đai Caspary
            waterMolecule.position.lerp(daiCasparyPos, speed);
            if (waterMolecule.position.distanceTo(daiCasparyPos) < 0.01) stage++;
        } else if (stage === gianBaoPos.length + 2) {
            // Đi tới mạch gỗ
            waterMolecule.position.lerp(machGoPos, speed);
            if (waterMolecule.position.distanceTo(machGoPos) < 0.01) stage++;
        } else if (stage === gianBaoPos.length + 3) {
            // Di chuyển lên trên mạch gỗ
            waterMolecule.position.y += speed;
            if (waterMolecule.position.y >= machGoPos.y + 0.5) {
                scene2.remove(waterMolecule); // Xóa phân tử nước khi hoàn tất
                return;
            }
        }

        requestAnimationFrame(animateWaterGianBao);
    }

    animateWaterGianBao();
}

// Hàm tạo và di chuyển phân tử nước qua con đường tế bào chất
function createWaterMoleculeTeBaoChat(longHutPos, teBaoChatPos, daiCasparyPos, machGoPos) {
    const waterMolecule = new THREE.Mesh(waterGeometryScene2, waterMaterialScene2);
    waterMolecule.position.set(longHutPos.x, longHutPos.y, longHutPos.z + 0.2); // Bắt đầu cách lông hút 1 đoạn theo trục z
    scene2.add(waterMolecule);

    const speed = 0.01;
    let stage = 0;

    function animateWaterTeBaoChat() {
        if (stage === 0) {
            // Di chuyển tới lông hút
            waterMolecule.position.z -= speed;
            if (waterMolecule.position.z <= longHutPos.z) stage = 1;
        } else if (stage > 0 && stage <= teBaoChatPos.length) {
            // Di chuyển qua các điểm tế bào chất
            waterMolecule.position.lerp(teBaoChatPos[stage - 1], speed);
            if (waterMolecule.position.distanceTo(teBaoChatPos[stage - 1]) < 0.01) stage++;
        } else if (stage === teBaoChatPos.length + 1) {
            // Đi tới đai Caspary
            waterMolecule.position.lerp(daiCasparyPos, speed);
            if (waterMolecule.position.distanceTo(daiCasparyPos) < 0.01) stage++;
        } else if (stage === teBaoChatPos.length + 2) {
            // Đi tới mạch gỗ
            waterMolecule.position.lerp(machGoPos, speed);
            if (waterMolecule.position.distanceTo(machGoPos) < 0.01) stage++;
        } else if (stage === teBaoChatPos.length + 3) {
            // Di chuyển lên trên mạch gỗ
            waterMolecule.position.y += speed;
            if (waterMolecule.position.y >= machGoPos.y + 0.5) {
                scene2.remove(waterMolecule); // Xóa phân tử nước khi hoàn tất
                return;
            }
        }

        requestAnimationFrame(animateWaterTeBaoChat);
    }

    animateWaterTeBaoChat();
}

// Hàm gọi cả hai con đường cùng một lúc
function animateBothPathsScene2() {
    const longHutPos = longHut.position;
    const daiCasparyPos = daiCaspary.position;
    const machGoPos = machGo.position;

    const gianBaoPos = [gianBao1.position, gianBao2.position, gianBao3.position];
    const teBaoChatPos = [teBaoChat1.position, teBaoChat2.position];

        createWaterMoleculeGianBao(longHutPos, gianBaoPos, daiCasparyPos, machGoPos);
        createWaterMoleculeTeBaoChat(longHutPos, teBaoChatPos, daiCasparyPos, machGoPos);


    // Gọi lại sau một khoảng thời gian để tiếp tục tạo phân tử
    setTimeout(animateBothPathsScene2, params.interval); // Thời gian giữa các lần gọi
}

// Bắt đầu quá trình
animateBothPathsScene2();


    // Sự kiện di chuyển chuột
    window.addEventListener('mousemove', (event) => {
        if (currentScene === scene2) {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            raycaster.setFromCamera(mouse, camera);

            const intersects = raycaster.intersectObjects(interactableObjects);
            if (intersects.length > 0) {
                const hoverObject = intersects[0].object;

                // Hiển thị thông tin cho đối tượng hover
                if (highlightedObject !== hoverObject) {
                    highlightedObject = hoverObject;
                    outlinePass.selectedObjects = [highlightedObject];
                    infoElement.style.display = 'block';
                    infoElement.style.left = `${event.clientX + 10}px`;
                    infoElement.style.top = `${event.clientY + 10}px`;

                    // Hiển thị tên tương ứng
                    if (highlightedObject.name.startsWith('dai_caspary')) {
                        infoElement.innerText = 'Đai Caspari là vùng đai chạy quanh thành các tế bào nội bì (Giữa phần vỏ và phần trung trụ), chủ yếu ở rễ, làm cho toàn bộ chiều dày của thành sơ cấp thấm suberin và/hoặc thấm lignin khiến cho thành các tế bào này không thấm nước và chất khoáng hoà tan, khi chúng được hấp thụ vào cây.';
                    } else if (highlightedObject.name.startsWith('gian_bao')) {
                        infoElement.innerText = 'Con đường gian bào là con đường mà dòng nước và ion khoáng đi từ đất vào mạch gỗ của rễ. Theo đó, nước và ion khoáng đi từ đất vào mạch gỗ của rễ đi theo không gian giữa các tế bào và các bó sợi xenlulôzơ bên trong thành tề bào. Con đường này đi đến nội bì đai Caspari.';
                    } else if (highlightedObject.name === 'long_hut') {
                        infoElement.innerText = 'Lông hút là tế bào biểu bì kéo dài có chức năng hút nước và muối khoáng hoà tan.';
                    } else if (highlightedObject.name === 'mach_go'||highlightedObject.name === 'mach') {
                        infoElement.innerText = 'Mạch gỗ (xylem) là một loại mạch vận chuyển nước và ion khoáng ở cây.';
                    } else if (highlightedObject.name.startsWith('te_bao_chat')) {
                        infoElement.innerText = 'Con đường tế bào chất là con đường mà dòng nước và ion khoáng đi từ đất vào mạch gỗ của rễ. Theo con đường này, nước và ion khoáng đi từ đất vào mạch gỗ của rễ sẽ đi xuyên qua tế bào chất của các tế bào.';
                    } else if (highlightedObject.name === 'than') {
                        infoElement.innerHTML = `<img src="./assets/roots.jpg" alt="Thân cây" style="width: 300px; height: auto;">`;
                    }
                    drawLineToInfoElement(highlightedObject);
                }
            } else {
                highlightedObject = null;
                outlinePass.selectedObjects = [];
                infoElement.style.display = 'none';
                if (line) scene2.remove(line);
            }
        }
    });
});

loader.load('./assets/stem.glb', function (gltf) {
    let model = gltf.scene;
    model.position.set(0, 0, 0);
    scene3.add(model);

    // Tìm các đối tượng trong scene3 để tương tác
    const stem = model.getObjectByName('stem');
    const highLayer = model.getObjectByName('high_layer');
    const phloem = model.getObjectByName('phloem');
    const xylem = model.getObjectByName('xylem');

    const interactableObjects = [stem, highLayer, phloem, xylem];

    // Hàm tạo và di chuyển phân tử nước cho scene3 (từ mạch gỗ lên trên theo trục y)
    function createWaterDropletScene3(xylemPos) {
        const droplet = new THREE.Mesh(waterGeometry, waterMaterial);
        droplet.position.set(xylemPos.x, xylemPos.y - 1, xylemPos.z); // Vị trí bắt đầu dưới mạch gỗ một khoảng nhỏ theo trục y
        scene3.add(droplet);

        const speed = 0.02;
        let stage = 1;

        function animateDroplet() {
            if (stage === 1) {
                droplet.position.y += speed; // Di chuyển lên trên theo trục y
                if (droplet.position.y >= xylemPos.y + 1) {
                    
                    stage = 2;
                }
            } else if (stage === 2) {
                droplet.position.y += speed;
                if (droplet.position.y >= xylemPos.y + 1.1) {
                    
                    scene3.remove(droplet); // Dừng lại khi đến vị trí cuối
                    return;
                }
            }

            requestAnimationFrame(animateDroplet);
        }

        animateDroplet();
    }

    // Hàm tạo và di chuyển phân tử đường cho scene3 (từ mạch rây xuống dưới theo trục y)
    function createSugarMoleculeScene3(phloemPos) {
        const sugarMolecule = new THREE.Mesh(sugarGeometry, sugarMaterial);
        sugarMolecule.position.set(phloemPos.x, phloemPos.y + 1, phloemPos.z); // Vị trí bắt đầu trên mạch rây một khoảng nhỏ theo trục y
        scene3.add(sugarMolecule);

        const speed = 0.01;
        let stage = 1;

        function animateSugar() {
            if (stage === 1) {
                sugarMolecule.position.y -= speed; // Di chuyển xuống dưới theo trục y
                if (sugarMolecule.position.y <= phloemPos.y - 1) {
                    
                    stage = 2;
                }
            } else if (stage === 2) {
                sugarMolecule.position.y -= speed;
                if (sugarMolecule.position.y <= phloemPos.y - 1.1) {
                    
                    scene3.remove(sugarMolecule); // Dừng lại khi đến vị trí cuối
                    return;
                }
            }

            requestAnimationFrame(animateSugar);
        }

        animateSugar();
    }

    // Hàm gọi liên tục các phân tử nước và đường trong scene3
    function animateMoleculesScene3() {
        // Lấy các vị trí của mạch gỗ và mạch rây trong scene3
        const xylemPos = xylem.position;
        const phloemPos = phloem.position;

        createWaterDropletScene3(xylemPos);
        createSugarMoleculeScene3(phloemPos);

        // Gọi lại sau một khoảng thời gian để tiếp tục tạo phân tử
        setTimeout(animateMoleculesScene3, params.interval); // Thời gian giữa các lần gọi
    }

    animateMoleculesScene3(); // Bắt đầu quá trình

    // Sự kiện di chuyển chuột cho scene3
    window.addEventListener('mousemove', (event) => {
        if (currentScene === scene3) {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            raycaster.setFromCamera(mouse, camera);

            const intersects = raycaster.intersectObjects(interactableObjects);
            if (intersects.length > 0) {
                const hoverObject = intersects[0].object;

                // Hiển thị thông tin cho đối tượng hover
                if (highlightedObject !== hoverObject) {
                    highlightedObject = hoverObject;
                    outlinePass.selectedObjects = [highlightedObject];
                    infoElement.style.display = 'block';
                    infoElement.style.left = `${event.clientX + 10}px`;
                    infoElement.style.top = `${event.clientY + 10}px`;

                    // Gán tên của từng đối tượng
                    if (highlightedObject === stem) {
                        infoElement.innerText = 'Thân cây.';
                    } else if (highlightedObject === highLayer) {
                        infoElement.innerText = 'Tầng sinh mạch hay còn gọi là tầng sinh trụ, tượng tầng mạch, tượng tầng libe - gỗ, tầng phát sinh libe - gỗ là mô sinh trưởng chính trong thân và rễ của nhiều loài thực vật, đặc biệt là ở các cây hai lá mầm và ở một số thực vật có mạch khác. Tầng sinh mạch là mô phân sinh thứ cấp và cũng là loại tượng tầng chính ở thực vật.[1] Nó tạo ra mạch gỗ thứ cấp hướng vào trong về phía tủy và mạch rây thứ cấp hướng ra ngoài, về phía vỏ cây.';
                    } else if (highlightedObject === phloem) {
                        infoElement.innerText = 'Mạch rây(phloem) vận chuyển các chất hữu cơ được tổng hợp trong quá trình quang hợp ở lá đến các bộ phân khác của cây.';
                    } else if (highlightedObject === xylem) {
                        infoElement.innerText = 'Mạch gỗ (xylem) là một loại mạch vận chuyển nước và ion khoáng ở cây.';
                    }
                    drawLineToInfoElement(highlightedObject);
                }
            } else {
                highlightedObject = null;
                outlinePass.selectedObjects = [];
                infoElement.style.display = 'none';
                if (line) currentScene.remove(line);
            }
        }
    });
});

loader.load('./assets/leaf_structure.glb', function (gltf) {
    let model = gltf.scene;
    model.position.set(0, 0, 0);
    scene4.add(model);

    // Tìm các đối tượng phien_la, dinh_la, cuong_la, gan_la
    const phienLa = model.getObjectByName('phien_la');
    const dinhLa = model.getObjectByName('dinh_la');
    const cuongLa = model.getObjectByName('cuong_la');
    const ganLa = model.getObjectByName('gan_la');

    const interactableObjects = [phienLa, dinhLa, cuongLa, ganLa];

// Sự kiện click vào phien_la để chuyển sang scene5
window.addEventListener('click', (event) => {
    if (currentScene === scene4) { // Kiểm tra nếu đang ở scene4
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);

        // Kiểm tra xem có click vào phien_la hay không
        const intersects = raycaster.intersectObject(phienLa);
        if (intersects.length > 0) {
            // Chuyển sang scene5
            currentScene = scene5;
            updateComposer();

            if (!leafModel) {
                // Tải mô hình leaf.glb nếu chưa tải
                loader.load('./assets/leaf.glb', function (gltf) {
                    leafModel = gltf.scene;
                    leafModel.position.set(0, 0, 0);
                    scene5.add(leafModel);

                    // Tìm các đối tượng trong leaf.glb
                    const bieuBi = leafModel.getObjectByName('bieu_bi');
                    const cutin = leafModel.getObjectByName('cutin');
                    const khiKhong = leafModel.getObjectByName('khi_khong');
                    const leafCell = leafModel.getObjectByName('leaf_cell');
                    const leafCell_1 = leafModel.getObjectByName('leaf_cell_1');
                    const teBaoMoGiau = leafModel.getObjectByName('te_bao_mo_giau');
                    const xylem = leafModel.getObjectByName('xylem');
                    const phloem = leafModel.getObjectByName('phloem');
                    const boMach = leafModel.getObjectByName('bo_mach');
                    const moMem = leafModel.getObjectByName('mo_mem');
                    const longLa = leafModel.getObjectByName('long_la');

                    // Gọi hàm hoạt hình cho phân tử nước và phân tử đường
                    animateWaterDroplets(xylem.position, leafCell.position, khiKhong.position);
                    animateSugarMolecules(leafCell.position, xylem.position, phloem.position);

                    // Danh sách các đối tượng có thể tương tác trong scene5
                    const scene5Interactables = [bieuBi, cutin, khiKhong, leafCell, leafCell_1, teBaoMoGiau, xylem, phloem,boMach,moMem,longLa];

                    // Sự kiện di chuyển chuột cho scene5
                    window.addEventListener('mousemove', (event) => {
                        if (currentScene === scene5) {
                            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
                            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
                            raycaster.setFromCamera(mouse, camera);

                            const intersects = raycaster.intersectObjects(scene5Interactables);
                            if (intersects.length > 0) {
                                if (highlightedObject !== intersects[0].object) {
                                    highlightedObject = intersects[0].object;
                                    outlinePass.selectedObjects = [highlightedObject];
                                    infoElement.style.display = 'block';
                                    infoElement.style.left = `${event.clientX + 10}px`;
                                    infoElement.style.top = `${event.clientY + 10}px`;

                                    // Hiển thị thông tin dựa trên đối tượng được chọn
                                    if (highlightedObject === bieuBi) {
                                        infoElement.innerText = 'Biểu bì là lớp bảo vệ bên ngoài của lá.';
                                    } else if (highlightedObject === cutin) {
                                        infoElement.innerText = 'Lớp cutin là lớp phủ bề mặt lá có tác dụng giảm thoát hơi nước.';
                                    } else if (highlightedObject === khiKhong) {
                                        infoElement.innerText = 'Khí khổng có chức năng giúp lá trao đổi khí với môi trường và thoát hơi nước ra ngoài.';
                                    } else if (highlightedObject === leafCell || highlightedObject === leafCell_1) {
                                        infoElement.innerText = 'Tế bào thịt lá là nơi quang hợp, vách mỏng giúp ánh sáng dễ dàng truyền qua, bên trong chứa nhiều lục lạp.';
                                    } else if (highlightedObject === teBaoMoGiau) {
                                        infoElement.innerText = 'Tế bào mô giậu là các tế bào chứa nhiều lục lạp có chức năng quan trọng trong việc hấp thụ năng lượng ánh sáng cho quang hợp.';
                                    } else if (highlightedObject === xylem) {
                                        infoElement.innerText = 'Mạch gỗ (xylem) là một loại mạch vận chuyển nước và ion khoáng ở cây.';
                                    } else if (highlightedObject === phloem) {
                                        infoElement.innerText = 'Mạch rây(phloem) vận chuyển các chất hữu cơ được tổng hợp trong quá trình quang hợp ở lá đến các bộ phân khác của cây.';
                                    } else if (highlightedObject === moMem) {
                                        infoElement.innerText = 'Mô mềm libe gồm những tế bào sống có màng mỏng bằng cellulose có nhiệm vụ chứa cất dự trữ như tinh bột, dầu và các sản phẩm khác.';
                                    }
                                    else if (highlightedObject === boMach) {
                                        infoElement.innerText = 'Bó mạch bao gồm mạch gỗ và mạch rây.';
                                    } 
                                     else if (highlightedObject === longLa) {
                                        infoElement.innerText = 'Lông lá.';
                                    }
                                    drawLineToInfoElement(highlightedObject);
                                }
                            } else {
                                highlightedObject = null;
                                outlinePass.selectedObjects = [];
                                infoElement.style.display = 'none';
                                if (line) currentScene.remove(line);
                            }
                        }
                    });
                });
            } else {
                // Nếu leafModel đã được tải, chỉ cần thêm vào scene5
                scene5.add(leafModel);
            }
        }
    }
});

    // Sự kiện di chuyển chuột cho scene4
    window.addEventListener('mousemove', (event) => {
        if (currentScene === scene4) {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(interactableObjects);

            if (intersects.length > 0) {
                if (highlightedObject !== intersects[0].object) {
                    highlightedObject = intersects[0].object;
                    outlinePass.selectedObjects = [highlightedObject];

                    infoElement.style.display = 'block';
                    infoElement.style.left = `${event.clientX + 10}px`;
                    infoElement.style.top = `${event.clientY + 10}px`;

                    if (highlightedObject === phienLa) {
                        infoElement.innerText = 'Phiến lá là phần chính của lá, nơi thực hiện quá trình quang hợp.';
                    } else if (highlightedObject === dinhLa) {
                        infoElement.innerText = 'Đỉnh lá là phần cuối cùng của lá, thường có hình dạng nhọn hoặc tròn.';
                    } else if (highlightedObject === cuongLa) {
                        infoElement.innerText = 'Cuống lá là phần nối lá với thân cây, giúp lá nhận nước và dinh dưỡng.';
                    } else if (highlightedObject === ganLa) {
                        infoElement.innerText = 'Gân lá là hệ thống mạch vận chuyển nước và chất dinh dưỡng trong lá.';
                    }
                    drawLineToInfoElement(highlightedObject);
                }
            } else {
                highlightedObject = null;
                outlinePass.selectedObjects = [];
                infoElement.style.display = 'none';
                if (line) currentScene.remove(line);
            }
        }
    });
});

let waterPathVisible = true; // Mặc định hiển thị đường đi của nước
let sugarPathVisible = true; // Mặc định hiển thị đường đi của đường

// Lưu các hình trụ đường đi của nước và đường để quản lý việc ẩn/hiện
let waterPathCylinders = [];
let sugarPathCylinders = [];

// Thêm sự kiện cho nút bật/tắt đường đi của nước
document.getElementById("toggleWaterPath").addEventListener("click", () => {
    waterPathVisible = !waterPathVisible;
    toggleWaterPath();
});

// Thêm sự kiện cho nút bật/tắt đường đi của đường
document.getElementById("toggleSugarPath").addEventListener("click", () => {
    sugarPathVisible = !sugarPathVisible;
    toggleSugarPath();
});

// Hàm hiển thị/ẩn đường đi của nước
function toggleWaterPath() {
    waterPathCylinders.forEach(cylinder => {
        if (waterPathVisible) {
            scene5.add(cylinder);
        } else {
            scene5.remove(cylinder);
        }
    });
}

// Hàm hiển thị/ẩn đường đi của đường
function toggleSugarPath() {
    sugarPathCylinders.forEach(cylinder => {
        if (sugarPathVisible) {
            scene5.add(cylinder);
        } else {
            scene5.remove(cylinder);
        }
    });
}

// Hàm tạo khối trụ mô tả đường di chuyển của nước giữa hai điểm
function createPathCylinder(startPos, endPos, type = 'water') {
    const pathLength = startPos.distanceTo(endPos); // Tính chiều dài của khối trụ
    const cylinderGeometry = new THREE.CylinderGeometry(0.005, 0.005, pathLength, 8); // Đường kính nhỏ

    let cylinderMaterial;
    if (type === 'water') {
        cylinderMaterial = new THREE.MeshBasicMaterial({
            map: arrowTexture, // Texture cho phân tử nước
        });
    } else if (type === 'sugar') {
        cylinderMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000, // Màu đỏ cho phân tử đường
        });
    }

    const pathCylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
    pathCylinder.position.copy(startPos).lerp(endPos, 0.5);//0.5 là alpha , 0 là vị trí đầu , 1 vị trí đích , o.5 ở giữa

    const direction = new THREE.Vector3().subVectors(endPos, startPos).normalize();
    const axis = new THREE.Vector3(0, 1, 0); // Trục mặc định của CylinderGeometry
    pathCylinder.quaternion.setFromUnitVectors(axis, direction);

    if (type === 'water') {
        waterPathCylinders.push(pathCylinder);
    } else if (type === 'sugar') {
        sugarPathCylinders.push(pathCylinder);
    }

    // Nếu đường đi của nước/đường cần được hiển thị, thêm vào scene
    if (type === 'water' && waterPathVisible) {
        scene5.add(pathCylinder);
    } else if (type === 'sugar' && sugarPathVisible) {
        scene5.add(pathCylinder);
    }
}

// Hàm tạo và di chuyển khói
function createSmokeEffect(startPosition) {
    const smokeParticles = []; // Mảng chứa các sprite khói

    // Tạo nhiều sprite khói
    for (let i = 0; i < 10; i++) { // Tăng số lượng sprite khói nếu muốn khói dày hơn
        const smokeSprite = new THREE.Sprite(new THREE.SpriteMaterial({
            map: smokeTexture,
            transparent: true,
            opacity: 0.5,
        }));

        // Đặt vị trí ban đầu của từng sprite khói với một chút ngẫu nhiên
        smokeSprite.position.set(
            startPosition.x + (Math.random() - 0.5) * 0.1, 
            startPosition.y + (Math.random() - 0.5) * 0.1,
            startPosition.z
        );
        
        smokeSprite.scale.set(0.1, 0.1, 0.1); // Kích thước nhỏ hơn phân tử nước
        scene5.add(smokeSprite);
        smokeParticles.push(smokeSprite);
    }

    let smokeLife = 0.5; // Thời gian tồn tại của khói
    const smokeSpeed = 0.01; // Tốc độ di chuyển của khói theo trục z

    // Hàm animation để di chuyển và làm mờ từng sprite khói
    function animateSmoke() {
        smokeParticles.forEach((smokeSprite) => {
            if (smokeLife > 0) {
                smokeSprite.position.y -= smokeSpeed * (0.5 + Math.random() * 0.5); // Di chuyển xuống với tốc độ ngẫu nhiên
                smokeSprite.material.opacity -= 0.005; // Giảm opacity từ từ
            }
        });

        smokeLife -= 0.02;
        if (smokeLife > 0) {
            requestAnimationFrame(animateSmoke);
        } else {
            // Xóa tất cả sprite khói sau khi chúng đã biến mất
            smokeParticles.forEach((smokeSprite) => scene5.remove(smokeSprite));
        }
    }

    animateSmoke();
}

// Hàm tạo và di chuyển các phân tử nước
function createWaterDroplet(xylemPos, leafCellPos, khiKhongPos) {
    const droplet = new THREE.Mesh(waterGeometry, waterMaterial);
    droplet.position.set(xylemPos.x, xylemPos.y, xylemPos.z - 1);
    scene5.add(droplet);
    const speed = 0.02;
    let stage = 1;

    function animateDroplet() {
        if (stage === 1) {
            droplet.position.z += speed;
            if (droplet.position.z >= xylemPos.z) {
                createPathCylinder(new THREE.Vector3(xylemPos.x, xylemPos.y, xylemPos.z - 1), xylemPos,'water');
                stage = 2;
            }
        } else if (stage === 2) {
            droplet.position.z += speed;
            if (droplet.position.z >= xylemPos.z + 0.4) {
                createPathCylinder(new THREE.Vector3(xylemPos.x, xylemPos.y, xylemPos.z), new THREE.Vector3(xylemPos.x, xylemPos.y, xylemPos.z + 0.4),'water');
                stage = 3;
            }
        } else if (stage === 3) {
            droplet.position.lerp(leafCellPos, speed);
            if (droplet.position.distanceTo(leafCellPos) < 0.05) {
                createPathCylinder(new THREE.Vector3(xylemPos.x, xylemPos.y, xylemPos.z + 0.4), leafCellPos,'water');
                stage = 4;
            }
        } else if (stage === 4) {
            droplet.position.lerp(khiKhongPos, speed);
            if (droplet.position.distanceTo(khiKhongPos) < 0.05) {
                createPathCylinder(leafCellPos, khiKhongPos,'water');
                scene5.remove(droplet);
                createSmokeEffect(khiKhongPos); // Tạo khói tại khí khổng
                return;
            }
        }
        requestAnimationFrame(animateDroplet);
    }
    animateDroplet();
}

// Hàm tạo và di chuyển các phân tử đường
function createSugarMolecule(leafCellPos, xylemPos, phloemPos) {
    const sugarMolecule = new THREE.Mesh(sugarGeometry, sugarMaterial);
    sugarMolecule.position.set(leafCellPos.x, leafCellPos.y, leafCellPos.z);
    scene5.add(sugarMolecule);
    const speed = 0.01;
    let stage = 1;

    function animateSugar() {
        if (stage === 1) {
            // Di chuyển ra ngoài một chút từ leafCellPos
            sugarMolecule.position.z += speed;
            if (sugarMolecule.position.z >= leafCellPos.z + 0.5) {
                createPathCylinder(new THREE.Vector3(leafCellPos.x, leafCellPos.y, leafCellPos.z), new THREE.Vector3(leafCellPos.x, leafCellPos.y, leafCellPos.z+0.5),'sugar');
                stage = 2;
            }
        } else if (stage === 2) {
            // Di chuyển tới vị trí của phloem
            sugarMolecule.position.lerp(phloemPos, speed);
            createPathCylinder(new THREE.Vector3(leafCellPos.x, leafCellPos.y, leafCellPos.z+0.5),phloemPos,'sugar');
            if (sugarMolecule.position.distanceTo(phloemPos) < 0.05) {
                stage = 3;
            }
        } else if (stage === 3) {
            // Di chuyển thêm một đoạn ngắn sau khi tới phloem
            sugarMolecule.position.z -= speed;
            createPathCylinder(new THREE.Vector3(phloemPos.x, phloemPos.y, leafCellPos.z), new THREE.Vector3(phloemPos.x, phloemPos.y, phloemPos.z-1),'sugar')
            if (sugarMolecule.position.z <= phloemPos.z -1) {
                // Biến mất khi di chuyển ra khỏi phloem
                scene5.remove(sugarMolecule);
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
    setTimeout(() => animateWaterDroplets(xylemPos, leafCellPos, khiKhongPos), params.interval);
}

// Hàm gọi liên tục các phân tử đường
function animateSugarMolecules(leafCellPos, xylemPos, phloemPos) {
    createSugarMolecule(leafCellPos, xylemPos, phloemPos);
    setTimeout(() => animateSugarMolecules(leafCellPos, xylemPos, phloemPos), params.interval);
}



// Hàm render
function animate() {
    requestAnimationFrame(animate);
    composer.render();

    if (highlightedObject) {
        drawLineToInfoElement(highlightedObject);
    }
}

// Chuyển scene
document.getElementById('switch-btn1').addEventListener('click', function () {
    currentScene = scene1;
    updateComposer();
    updateToggleButtonVisibility();
});
document.getElementById('switch-btn2').addEventListener('click', function () {
    currentScene = scene2;
    updateComposer();
    updateToggleButtonVisibility();
});
document.getElementById('switch-btn3').addEventListener('click', function () {
    currentScene = scene3;
    updateComposer();
    updateToggleButtonVisibility();
});
document.getElementById('switch-btn4').addEventListener('click', function () {
    currentScene = scene4;
    updateComposer();
    updateToggleButtonVisibility();
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
