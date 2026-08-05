(function(){
  var wrap = document.getElementById('journeyWrap');
  var labelsLayer = document.getElementById('journeyLabels');
  var loadingEl = document.getElementById('journeyLoading');
  if (!wrap || typeof THREE === 'undefined') return;

  // ---------- scene / camera / renderer ----------
  var scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a2540);
  scene.fog = new THREE.Fog(0x0a2540, 420, 900);

  var camera = new THREE.PerspectiveCamera(42, wrap.clientWidth / wrap.clientHeight, 1, 2000);
  camera.position.set(0, 260, 430);
  camera.lookAt(0, 0, 0);

  var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(wrap.clientWidth, wrap.clientHeight);
  wrap.appendChild(renderer.domElement);
  if (loadingEl) loadingEl.style.display = 'none';

  // ---------- lighting ----------
  scene.add(new THREE.AmbientLight(0x9fb8d6, 0.65));
  var sun = new THREE.DirectionalLight(0xfff2cf, 1.1);
  sun.position.set(-180, 260, 160);
  scene.add(sun);
  var rim = new THREE.DirectionalLight(0x2a9d8f, 0.35);
  rim.position.set(200, 80, -200);
  scene.add(rim);

  // ---------- ocean ----------
  var oceanGeo = new THREE.PlaneGeometry(1400, 1400, 70, 70);
  oceanGeo.rotateX(-Math.PI / 2);
  var oceanMat = new THREE.MeshStandardMaterial({ color: 0x0f3a63, roughness: 0.65, metalness: 0.1, flatShading: true });
  var ocean = new THREE.Mesh(oceanGeo, oceanMat);
  ocean.position.y = -6;
  scene.add(ocean);
  var oceanPos = oceanGeo.attributes.position;
  var oceanBase = new Float32Array(oceanPos.array.length);
  oceanBase.set(oceanPos.array);

  // ---------- helpers ----------
  function makeIsland(radius, height, color, sandColor){
    var g = new THREE.Group();
    var rock = new THREE.Mesh(
      new THREE.IcosahedronGeometry(radius, 1),
      new THREE.MeshStandardMaterial({ color: color, flatShading: true, roughness: 0.9 })
    );
    rock.scale.set(1, height, 1);
    rock.position.y = radius * height * 0.35;
    rock.rotation.y = Math.random() * Math.PI;
    g.add(rock);
    var sand = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 1.15, radius * 1.3, 4, 20),
      new THREE.MeshStandardMaterial({ color: sandColor, flatShading: true, roughness: 1 })
    );
    sand.position.y = -1;
    g.add(sand);
    var halo = new THREE.Mesh(
      new THREE.RingGeometry(radius * 1.25, radius * 1.85, 32),
      new THREE.MeshBasicMaterial({ color: 0x2a9d8f, transparent: true, opacity: 0.28, side: THREE.DoubleSide })
    );
    halo.rotation.x = -Math.PI / 2;
    halo.position.y = -4.5;
    g.add(halo);
    return g;
  }

  var stops = {
    2025: new THREE.Vector3(-165, 0, -150),
    2026: new THREE.Vector3(-205, 0, 15),
    2027: new THREE.Vector3(-150, 0, 185),
    2028: new THREE.Vector3(130, 0, 25)
  };

  // islands are kept low and dome-like (not tall globes) so the library
  // building and chests sitting on top of them stay clearly visible
  function islandTopY(radius, height){ return radius * height * 1.35; }

  var islandDefs = {
    2025: { radius: 26, height: 0.42, rock: 0x3f7a35, sand: 0xd9c48b },
    2026: { radius: 30, height: 0.40, rock: 0x3f7a35, sand: 0xd9c48b },
    2027: { radius: 28, height: 0.40, rock: 0x3f7a35, sand: 0xd9c48b },
    2028: { radius: 58, height: 0.30, rock: 0x457e3a, sand: 0xe4d6a6 }
  };
  var islandTops = {};
  Object.keys(islandDefs).forEach(function(yr){
    var d = islandDefs[yr];
    var isl = makeIsland(d.radius, d.height, d.rock, d.sand);
    isl.position.copy(stops[yr]);
    scene.add(isl);
    islandTops[yr] = islandTopY(d.radius, d.height);
  });

  // ---------- ports: where the ship docks at each island ----------
  var ports = {
    2025: new THREE.Vector3(-128, 0, -113),
    2026: new THREE.Vector3(-150, 0, 32),
    2027: new THREE.Vector3(-101, 0, 168),
    2028: new THREE.Vector3(168, 0, 118)
  };

  function makePier(islandPos, portPos){
    var g = new THREE.Group();
    var dir = new THREE.Vector3().subVectors(portPos, islandPos);
    var length = dir.length();
    dir.normalize();
    var angle = Math.atan2(dir.x, dir.z);
    var woodMat = new THREE.MeshStandardMaterial({ color: 0x7c4f28, roughness: 0.85 });
    var postMat = new THREE.MeshStandardMaterial({ color: 0x4a2c17, roughness: 0.9 });
    var plank = new THREE.Mesh(new THREE.BoxGeometry(9, 2, length + 10), woodMat);
    plank.position.copy(islandPos).addScaledVector(dir, length / 2);
    plank.position.y = 2;
    plank.rotation.y = angle;
    g.add(plank);
    var postCount = Math.max(3, Math.round(length / 22));
    for (var i = 0; i <= postCount; i++){
      var t = i / postCount;
      var p = new THREE.Vector3().copy(islandPos).addScaledVector(dir, length * t);
      [-3.5, 3.5].forEach(function(off){
        var side = new THREE.Vector3(-dir.z, 0, dir.x).multiplyScalar(off);
        var post = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 11, 6), postMat);
        post.position.set(p.x + side.x, -3, p.z + side.z);
        g.add(post);
      });
    }
    return g;
  }

  scene.add(makePier(stops[2025], ports[2025]));
  scene.add(makePier(stops[2026], ports[2026]));
  scene.add(makePier(stops[2027], ports[2027]));
  scene.add(makePier(stops[2028], ports[2028]));

  // ---------- Library Commons building, atop the 2028 island ----------
  function buildLibrary(){
    var g = new THREE.Group();
    var wallMat = new THREE.MeshStandardMaterial({ color: 0xeef3f6, roughness: 0.7 });
    var trimMat = new THREE.MeshStandardMaterial({ color: 0x0f2b47, roughness: 0.6 });
    var roofMat = new THREE.MeshStandardMaterial({ color: 0x1c5b8f, roughness: 0.5 });
    var winMat = new THREE.MeshStandardMaterial({ color: 0xf4e8d0, emissive: 0xdba53d, emissiveIntensity: 0.55 });

    var body = new THREE.Mesh(new THREE.BoxGeometry(36, 24, 28), wallMat);
    body.position.y = 12;
    g.add(body);

    var base = new THREE.Mesh(new THREE.BoxGeometry(40, 3, 32), trimMat);
    base.position.y = 1.5;
    g.add(base);

    var roof = new THREE.Mesh(new THREE.ConeGeometry(29, 14, 4), roofMat);
    roof.position.y = 24 + 7;
    roof.rotation.y = Math.PI / 4;
    g.add(roof);

    var door = new THREE.Mesh(new THREE.BoxGeometry(7, 11, 1), trimMat);
    door.position.set(0, 5.5, 14.4);
    g.add(door);

    [-11, 11].forEach(function(x){
      var w = new THREE.Mesh(new THREE.BoxGeometry(6.5, 7.5, 1), winMat);
      w.position.set(x, 13, 14.4);
      g.add(w);
      var wSide = new THREE.Mesh(new THREE.BoxGeometry(1, 7.5, 6.5), winMat);
      wSide.position.set(x > 0 ? 18.4 : -18.4, 13, 0);
      g.add(wSide);
    });

    var sign = new THREE.Mesh(new THREE.BoxGeometry(20, 4, 1), new THREE.MeshStandardMaterial({ color: 0x0f2b47 }));
    sign.position.set(0, 21, 14.6);
    g.add(sign);

    var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 22, 6), trimMat);
    pole.position.set(-16, 24 + 11, -8);
    g.add(pole);
    var flag = new THREE.Mesh(new THREE.PlaneGeometry(9, 5.5), new THREE.MeshStandardMaterial({ color: 0xc0392b, side: THREE.DoubleSide }));
    flag.position.set(-16 + 4.5, 24 + 19, -8);
    flag.rotation.y = Math.PI / 2;
    g.add(flag);

    var porchLight = new THREE.PointLight(0xf6d78a, 0.9, 60);
    porchLight.position.set(0, 10, 20);
    g.add(porchLight);

    return g;
  }

  var library = buildLibrary();
  var libraryBaseY = islandTops[2028] + 1;
  library.position.copy(stops[2028]).add(new THREE.Vector3(-4, libraryBaseY, -4));
  library.rotation.y = -0.5;
  scene.add(library);

  // treasure chests — every island holds one; the 2028 "prize" chest glows brightest
  function buildTreasureChest(withGlow, glowIntensity){
    var chest = new THREE.Group();
    var woodMat = new THREE.MeshStandardMaterial({ color: 0x6b4226, roughness: 0.8 });
    var chestBase = new THREE.Mesh(new THREE.BoxGeometry(16, 10, 12), woodMat);
    chestBase.position.y = 5;
    chest.add(chestBase);
    var chestLid = new THREE.Mesh(
      new THREE.CylinderGeometry(6, 6, 16, 12, 1, false, 0, Math.PI),
      woodMat
    );
    chestLid.rotation.z = Math.PI / 2;
    chestLid.position.set(0, 10, 0);
    chest.add(chestLid);
    var chestLock = new THREE.Mesh(
      new THREE.BoxGeometry(3, 4.5, 2.5),
      new THREE.MeshStandardMaterial({ color: 0xe8bf5a, emissive: 0x82600f, emissiveIntensity: 0.5, metalness: 0.6, roughness: 0.3 })
    );
    chestLock.position.set(0, 6, 6.2);
    chest.add(chestLock);
    // a scatter of coins/gems spilling out, so it reads as "treasure"
    var gemColors = [0xe8bf5a, 0xf6d78a, 0x2a9d8f];
    for (var gi = 0; gi < 5; gi++){
      var gem = new THREE.Mesh(
        new THREE.OctahedronGeometry(1.3, 0),
        new THREE.MeshStandardMaterial({ color: gemColors[gi % gemColors.length], metalness: 0.5, roughness: 0.25, emissive: gemColors[gi % gemColors.length], emissiveIntensity: 0.25 })
      );
      var ga = (gi / 5) * Math.PI * 2;
      gem.position.set(Math.cos(ga) * 9, 1.2, 6 + Math.sin(ga) * 4);
      chest.add(gem);
    }
    if (withGlow){
      var glow = new THREE.PointLight(0xf6d78a, glowIntensity || 0.9, 60);
      glow.position.set(0, 16, 0);
      chest.add(glow);
    }
    return chest;
  }

  var chestOffsets = {
    2025: new THREE.Vector3(14, islandTops[2025] + 3, -6),
    2026: new THREE.Vector3(-16, islandTops[2026] + 3, 10),
    2027: new THREE.Vector3(12, islandTops[2027] + 3, -12),
    2028: new THREE.Vector3(26, islandTops[2028] + 4, 20)
  };
  [2025, 2026, 2027].forEach(function(yr){
    var smallChest = buildTreasureChest(false);
    smallChest.scale.set(0.55, 0.55, 0.55);
    smallChest.position.copy(stops[yr]).add(chestOffsets[yr]);
    scene.add(smallChest);
  });
  var chest = buildTreasureChest(true, 0.9);
  chest.position.copy(stops[2028]).add(chestOffsets[2028]);
  scene.add(chest);

  // ---------- dotted sailing route ----------
  var routePts = [stops[2025], stops[2026], stops[2027], stops[2028]];
  var routeGeo = new THREE.BufferGeometry().setFromPoints(routePts);
  var routeMat = new THREE.LineDashedMaterial({ color: 0xe8bf5a, dashSize: 8, gapSize: 6, transparent: true, opacity: 0.8 });
  var routeLine = new THREE.Line(routeGeo, routeMat);
  routeLine.position.y = 1;
  routeLine.computeLineDistances();
  scene.add(routeLine);

  // ---------- the ship, evolving from a small old galleon into a larger modern vessel ----------
  // stage 1 = 2025 (small, old wooden ship) ... stage 4 = 2028 (large, fully modern ship)
  function lerpColor(a, b, t){ return new THREE.Color(a).lerp(new THREE.Color(b), t); }
  function lerpNum(a, b, t){ return a + (b - a) * t; }

  function buildShipStage(stage){
    var t = (stage - 1) / 3; // 0, 0.33, 0.66, 1
    var ship = new THREE.Group();

    var primaryMat = new THREE.MeshStandardMaterial({ color: lerpColor(0x4a2c17, 0x1c2b3a, t), roughness: lerpNum(0.85, 0.5, t), metalness: lerpNum(0, 0.3, t) });
    var secondaryMat = new THREE.MeshStandardMaterial({ color: lerpColor(0x7c4f28, 0xd8e2e8, t), roughness: lerpNum(0.8, 0.35, t), metalness: lerpNum(0, 0.55, t) });
    var sailMat = new THREE.MeshStandardMaterial({ color: 0xe9dfc0, roughness: 0.9, side: THREE.DoubleSide });
    var trimGold = new THREE.MeshStandardMaterial({ color: 0xe8bf5a, roughness: 0.3, metalness: 0.6 });
    var darkMat = new THREE.MeshStandardMaterial({ color: lerpColor(0x4a2c17, 0x1c2b3a, t), roughness: 0.5, metalness: lerpNum(0, 0.4, t) });
    var glass = new THREE.MeshStandardMaterial({ color: 0x9fd8e6, roughness: 0.15, metalness: 0.2, emissive: 0x2a5d6b, emissiveIntensity: t * 0.3 });

    // hull morphs from a curved old-galleon belly into a sleek modern profile
    var hullPtsOld = [[0, -6], [7, -5], [11, 0], [10, 5], [4, 8], [0, 8.5]];
    var hullPtsModern = [[0, -5], [6, -4], [9, -0.5], [8.5, 3], [4, 6], [0, 6.5]];
    var hullPts = hullPtsOld.map(function(p, i){
      var m = hullPtsModern[i];
      return new THREE.Vector2(lerpNum(p[0], m[0], t), lerpNum(p[1], m[1], t));
    });
    var hull = new THREE.Mesh(new THREE.LatheGeometry(hullPts, 22), secondaryMat);
    hull.scale.set(1, 1, lerpNum(2.6, 2.7, t));
    hull.rotation.z = Math.PI / 2;
    hull.position.y = 4;
    ship.add(hull);

    // deck
    var deck = new THREE.Mesh(
      new THREE.BoxGeometry(lerpNum(9, 9.5, t), lerpNum(1.5, 1.2, t), lerpNum(40, 42, t)),
      stage >= 3 ? secondaryMat : primaryMat
    );
    deck.position.y = lerpNum(9, 10, t);
    ship.add(deck);

    if (stage <= 2){
      // old-galleon raised aft castle
      var aft = new THREE.Mesh(new THREE.BoxGeometry(10, 8, 12), primaryMat);
      aft.position.set(0, 13, -16);
      ship.add(aft);
    } else {
      // modern tiered bridge / cabin
      var cabin1 = new THREE.Mesh(new THREE.BoxGeometry(8.5, 6, 20), secondaryMat);
      cabin1.position.set(0, 13.6, -6);
      ship.add(cabin1);
      var cabin2 = new THREE.Mesh(new THREE.BoxGeometry(6.5, 5, 12), secondaryMat);
      cabin2.position.set(0, 19.1, -6);
      ship.add(cabin2);
      var bridgeWindow = new THREE.Mesh(new THREE.BoxGeometry(6, 1.8, 0.3), glass);
      bridgeWindow.position.set(0, 19.6, 0.1);
      ship.add(bridgeWindow);
    }

    // masts and sails thin out as the ship modernizes
    var mastConfigs = { 1: [-12, 2, 15], 2: [-12, 2], 3: [2], 4: [] };
    mastConfigs[stage].forEach(function(z){
      var h = z === 2 ? 46 : 34;
      var mast = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.2, h, 8), primaryMat);
      mast.position.set(0, 9 + h / 2, z);
      ship.add(mast);

      var sailW = z === 2 ? 20 : 14;
      var sailH = z === 2 ? 22 : 16;
      var sail = new THREE.Mesh(new THREE.PlaneGeometry(sailW, sailH, 4, 4), sailMat);
      sail.position.set(0, 9 + h * 0.62, z);
      sail.rotation.y = Math.PI / 2;
      var sp = sail.geometry.attributes.position;
      for (var vi = 0; vi < sp.count; vi++){
        var x = sp.getX(vi);
        sp.setZ(vi, Math.sin((x / sailW) * Math.PI) * 3.2);
      }
      sp.needsUpdate = true;
      sail.geometry.computeVertexNormals();
      ship.add(sail);
    });

    if (stage <= 2){
      var bowsprit = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.9, 16, 6), primaryMat);
      bowsprit.rotation.x = Math.PI / 2.6;
      bowsprit.position.set(0, 9, 26);
      ship.add(bowsprit);
    }

    if (stage >= 3){
      var bow = new THREE.Mesh(new THREE.ConeGeometry(1.4, 8, 8), secondaryMat);
      bow.rotation.x = Math.PI / 2;
      bow.position.set(0, 10.5, 25);
      ship.add(bow);

      var funnel = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 2.1, 7, 12), darkMat);
      funnel.position.set(0, 25, -10);
      ship.add(funnel);
      var funnelStripe = new THREE.Mesh(new THREE.CylinderGeometry(1.85, 1.85, 1.6, 12), trimGold);
      funnelStripe.position.set(0, 27.5, -10);
      ship.add(funnelStripe);

      var mast2 = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 16, 8), darkMat);
      mast2.position.set(0, 29, 0);
      ship.add(mast2);

      if (stage === 4){
        var radar = new THREE.Mesh(new THREE.BoxGeometry(5, 0.6, 1.2), darkMat);
        radar.position.set(0, 36.5, 0);
        ship.add(radar);
        var antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 6, 6), darkMat);
        antenna.position.set(0, 40, 0);
        ship.add(antenna);
        var portLight = new THREE.PointLight(0xff3b3b, 0.6, 20);
        portLight.position.set(-4.3, 10, 20);
        ship.add(portLight);
        var starLight = new THREE.PointLight(0x3bff6a, 0.6, 20);
        starLight.position.set(4.3, 10, 20);
        ship.add(starLight);
      }
    }

    // flag: red pennant on the old ship, gold on the modern one
    var flagColor = stage <= 2 ? 0xc0392b : 0xe8bf5a;
    var flagY = stage <= 2 ? 9 + 46 + 3 : 24;
    var flagZ = stage <= 2 ? 2 : -18;
    var flag = new THREE.Mesh(
      new THREE.PlaneGeometry(stage <= 2 ? 6 : 5, stage <= 2 ? 3.5 : 3),
      new THREE.MeshStandardMaterial({ color: flagColor, side: THREE.DoubleSide })
    );
    flag.position.set(0, flagY, flagZ);
    flag.rotation.y = Math.PI / 2.3;
    ship.add(flag);

    // grows larger with each island reached
    var s = 0.9 * lerpNum(0.6, 1.15, t);
    ship.scale.set(s, s, s);
    return ship;
  }

  var shipStages = {
    2025: buildShipStage(1),
    2026: buildShipStage(2),
    2027: buildShipStage(3),
    2028: buildShipStage(4)
  };
  var ship = new THREE.Group();
  Object.keys(shipStages).forEach(function(yr){
    shipStages[yr].visible = false;
    ship.add(shipStages[yr]);
  });

  function updateShipForm(year){
    Object.keys(shipStages).forEach(function(yr){
      shipStages[yr].visible = (parseInt(yr, 10) === year);
    });
  }

  var currentYear = 2026;
  ship.position.copy(ports[currentYear]);
  ship.userData.target = ship.position.clone();
  ship.userData.facing = 0;
  updateShipForm(currentYear);
  scene.add(ship);

  // ---------- year labels (HTML overlay, projected each frame) ----------
  var labelDefs = [
    { year: 2025, pos: stops[2025].clone().add(new THREE.Vector3(0, 34, 0)) },
    { year: 2026, pos: stops[2026].clone().add(new THREE.Vector3(0, 42, 0)) },
    { year: 2027, pos: stops[2027].clone().add(new THREE.Vector3(0, 40, 0)) },
    { year: 2028, pos: stops[2028].clone().add(new THREE.Vector3(0, 68, 0)) }
  ];
  var labelEls = {};
  labelDefs.forEach(function(def){
    var el = document.createElement('div');
    el.className = 'journey-badge' + (def.year === currentYear ? ' active' : '');
    el.textContent = def.year;
    labelsLayer.appendChild(el);
    labelEls[def.year] = el;
  });
  function project(vec3){
    var v = vec3.clone().project(camera);
    return {
      x: (v.x * 0.5 + 0.5) * wrap.clientWidth,
      y: (-(v.y * 0.5) + 0.5) * wrap.clientHeight
    };
  }

  // ---------- KRA data (from Talent & Learning Ecosystem Development Roadmap) ----------
  var kraData = {
    2025: {
      target: 'Baseline year — foundational policy and facility set-up across both KRAs.',
      items: [
        {
          title: 'Standard Certification and Accreditation of Schools',
          html: '<p>Division Policy on School Certification and Accreditation in Governance and Operations</p>'
        },
        {
          title: 'Library Commons for Lifelong Learners',
          html: '<ul><li>Division-level Library Commons facility with defined zones</li><li>60 Updated Learning Resources</li></ul>'
        }
      ]
    },
    2026: {
      target: 'Moving from policy to initial compliance — the Library Commons becomes fully structured and functional.',
      items: [
        {
          title: 'Standard Certification and Accreditation of Schools',
          html: '<p>100% of schools have LEVEL 1 Certification (Initial Compliance)</p>'
        },
        {
          title: 'Library Commons for Lifelong Learners',
          html: '<ul><li>Fully-structured Library Commons Facility</li><li>Functional Library System</li><li>Reading and Digital programs</li><li>Additional Updated Learning Resources</li></ul>'
        }
      ]
    },
    2027: {
      target: 'Improved compliance year — collections expand and access opens up to teachers and learners.',
      items: [
        {
          title: 'Standard Certification and Accreditation of Schools',
          html: '<p>100% of schools have LEVEL 2 Certification (Improved)</p>'
        },
        {
          title: 'Library Commons for Lifelong Learners',
          html: '<ul><li>Expanded digital and print collections thru subscription</li><li>Open-access portal for teachers and learners</li></ul>'
        }
      ]
    },
    2028: {
      target: 'Journey\u2019s end — full compliance and a fully-established Library Commons.',
      items: [
        {
          title: 'Standard Certification and Accreditation of Schools',
          html: '<p>100% of schools have Certificate of Accreditation (Full Compliance)</p>'
        },
        {
          title: 'Library Commons for Lifelong Learners',
          html: '<p>Fully-established Library Commons</p>'
        }
      ]
    }
  };

  var kraYearBadge = document.getElementById('kraYearBadge');
  var kraTarget = document.getElementById('kraTarget');
  var kraGrid = document.getElementById('kraGrid');

  function renderKra(year){
    var d = kraData[year];
    if(!d || !kraYearBadge) return;
    kraYearBadge.textContent = year;
    kraTarget.textContent = d.target;
    kraGrid.innerHTML = '';
    d.items.forEach(function(item){
      var card = document.createElement('div');
      card.className = 'kra-card kra-fade';
      card.innerHTML = '<h4>' + item.title + '</h4>' + item.html;
      kraGrid.appendChild(card);
    });
  }

  // ---------- year controls ----------
  var buttons = document.querySelectorAll('.year-btn');
  buttons.forEach(function(btn){
    btn.addEventListener('click', function(){
      var year = parseInt(btn.getAttribute('data-year'), 10);
      buttons.forEach(function(b){ b.classList.remove('active'); });
      btn.classList.add('active');
      Object.keys(labelEls).forEach(function(y){
        labelEls[y].classList.toggle('active', parseInt(y, 10) === year);
      });
      currentYear = year;
      ship.userData.target = ports[year].clone();
      updateShipForm(year);
      renderKra(year);
    });
  });

  renderKra(currentYear);

  // ---------- resize ----------
  function onResize(){
    var w = wrap.clientWidth, h = wrap.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  window.addEventListener('resize', onResize);

  // ---------- animation loop ----------
  var clock = new THREE.Clock();
  function animate(){
    requestAnimationFrame(animate);
    var t = clock.getElapsedTime();

    // waves
    for (var i = 0; i < oceanPos.count; i++){
      var ox = oceanBase[i * 3], oz = oceanBase[i * 3 + 2];
      var wy = Math.sin(ox * 0.03 + t * 1.1) * 2.2 + Math.cos(oz * 0.04 + t * 0.8) * 1.6;
      oceanPos.setY(i, wy);
    }
    oceanPos.needsUpdate = true;
    oceanGeo.computeVertexNormals();

    // ship movement toward target
    var target = ship.userData.target;
    var delta = new THREE.Vector3().subVectors(target, ship.position);
    delta.y = 0;
    var dist = delta.length();
    if (dist > 0.6){
      var dir = delta.clone().normalize();
      var desiredYaw = Math.atan2(dir.x, dir.z);
      var yawDiff = desiredYaw - ship.rotation.y;
      yawDiff = Math.atan2(Math.sin(yawDiff), Math.cos(yawDiff));
      ship.rotation.y += yawDiff * 0.06;
      var speed = Math.min(dist, 1.6);
      ship.position.addScaledVector(dir, speed);
    }
    // bob and rock, always, even at anchor
    ship.position.y = Math.sin(t * 1.8) * 1.6;
    ship.rotation.z = Math.sin(t * 1.3) * 0.035;
    ship.rotation.x = Math.sin(t * 1.05) * 0.02;

    // gentle camera drift for parallax life
    camera.position.x = Math.sin(t * 0.06) * 14;
    camera.lookAt(0, 0, 10);

    // project labels
    labelDefs.forEach(function(def){
      var p = project(def.pos);
      var el = labelEls[def.year];
      el.style.left = p.x + 'px';
      el.style.top = p.y + 'px';
    });
    renderer.render(scene, camera);
  }
  animate();
})();