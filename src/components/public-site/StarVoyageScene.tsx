"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { voyageCameraX } from "./voyage-camera";
import type { MotionValue } from "framer-motion";
import type * as ThreeTypes from "three";
import type { VoyageNavigationFlight } from "./voyage-progress";
import type { VoyageSceneState } from "./VoyageLoader";
import { voyageComposition } from "./voyage-layout";
import {
  clamp01,
  finale,
  smoothRange,
  visits,
  voyageState,
} from "./voyage-timeline";

type Props = {
  progress?: MotionValue<number>;
  compact?: boolean;
  navigationOpacity?: MotionValue<number>;
  navigationFlight?: MotionValue<VoyageNavigationFlight | null>;
  onStateChange?: (state: VoyageSceneState) => void;
};

/** One deterministic timeline owns camera, flight, stops, occlusion and the final logo. */
export default function StarVoyageScene({
  progress,
  compact = false,
  navigationOpacity,
  navigationFlight,
  onStateChange,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sealedLogoRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const host = hostRef.current,
      canvas = canvasRef.current;
    if (!host || !canvas) return;
    function loadingState(state: VoyageSceneState) {
      if (disposed || host!.dataset.sceneState === state) return;
      host!.dataset.sceneState = state;
      onStateChange?.(state);
    }
    let disposed = false;
    loadingState("loading");
    let cleanup: (() => void) | undefined;
    async function initialise() {
      const [
        THREE,
        { createPhysicsLogo },
        { createSolarPlanets },
        { createVoyageStar },
        { createVoyageMotion },
        { createVoyageWake },
      ] = await Promise.all([
        import("three"),
        import("./logo-geometry"),
        import("./solar-planets"),
        import("./voyage-star"),
        import("./voyage-motion"),
        import("./voyage-wake"),
      ]);
      const [logo, planets] = await Promise.all([
        createPhysicsLogo(),
        createSolarPlanets(),
      ]);
      const traveller = createVoyageStar(),
        star = traveller.group;
      if (disposed) {
        logo.dispose();
        planets.dispose();
        traveller.dispose();
        return;
      }
      let renderer: ThreeTypes.WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({
          canvas: canvas!,
          alpha: true,
          antialias: true,
          powerPreference: "low-power",
        });
      } catch {
        logo.dispose();
        planets.dispose();
        traveller.dispose();
        loadingState("unavailable");
        return;
      }
      renderer.setClearColor(0, 0);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.12;
      renderer.shadowMap.enabled = false;
      const scene = new THREE.Scene();
      let worldStep = 24;
      const planetWorldX = (index: number) => (index + 1) * worldStep + 4;
      const finalWorldX = () => (visits.length + 1) * worldStep;
      const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 400);
      scene.add(new THREE.HemisphereLight(0xdfe7ff, 0x202335, 1.55));
      const key = new THREE.DirectionalLight(0xfff5df, 2.35);
      key.position.set(-5, 5, 8);
      scene.add(key);
      const rim = new THREE.DirectionalLight(0xb7a4ff, 1.4);
      rim.position.set(5, 3, -4);
      scene.add(rim);
      const starLight = new THREE.PointLight(0xfdd835, 0.9, 8, 2);
      scene.add(starLight);
      logo.star.removeFromParent();
      scene.add(star);
      scene.add(logo.group);
      planets.groups.forEach((planet, index) => {
        planet.position.set(planetWorldX(index), 0, -2);
        planet.visible = false;
        scene.add(planet);
      });

      const glowCanvas = document.createElement("canvas");
      glowCanvas.width = glowCanvas.height = 128;
      const context = glowCanvas.getContext("2d")!;
      const glowGradient = context.createRadialGradient(64, 64, 4, 64, 64, 64);
      glowGradient.addColorStop(0, "rgba(253,216,53,.25)");
      glowGradient.addColorStop(0.3, "rgba(253,216,53,.055)");
      glowGradient.addColorStop(1, "rgba(253,216,53,0)");
      context.fillStyle = glowGradient;
      context.fillRect(0, 0, 128, 128);
      const glowTexture = new THREE.CanvasTexture(glowCanvas);
      const glowMaterial = new THREE.SpriteMaterial({
        map: glowTexture,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      });
      const glow = new THREE.Sprite(glowMaterial);
      scene.add(glow);

      const trailCount = 180;
      const wake = createVoyageWake(true);
      const trailPositions = new Float32Array(trailCount * 3),
        trailAlphas = new Float32Array(trailCount);
      const trailGeometry = new THREE.BufferGeometry();
      trailGeometry.setAttribute(
        "position",
        new THREE.BufferAttribute(trailPositions, 3),
      );
      trailGeometry.setAttribute(
        "alpha",
        new THREE.BufferAttribute(trailAlphas, 1),
      );
      const trailMaterial = new THREE.ShaderMaterial({
        transparent: true,
        depthTest: true,
        depthWrite: false,
        uniforms: { opacity: { value: 0.42 } },
        vertexShader: `attribute float alpha;varying float a;void main(){a=alpha;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
        fragmentShader: `uniform float opacity;varying float a;void main(){gl_FragColor=vec4(1.,.84,.21,a*opacity);}`,
      });
      const trail = new THREE.Line(trailGeometry, trailMaterial);
      trail.frustumCulled = false;
      scene.add(trail);
      let narrow = false,
        short = false,
        planetScale = 1.7,
        width = 1,
        height = 1,
        drawHeight = 1,
        visible = true,
        frame = 0,
        renderedFrames = 0;
      let previousReading = false,
        previousOrbit = false;
      let lightFocus = 0,
        previousLightTime = 0;
      let navigationId = -1,
        navigationCameraFrom = 0;
      const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
      const temp = new THREE.Vector3();
      const finalCenter = new THREE.Vector3();
      const orbitTangent = new THREE.Vector3();
      function logoTransform(p: number) {
        void p;
        return {
          scale: narrow ? 0.8 : short ? 0.9 : 0.65,
          x: !narrow && short
            ? -Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * 16 * camera.aspect * 0.52
            : 0,
          y: narrow ? 0.45 : short ? 0.4 : 2.1,
        };
      }
      function orbitTimeAt(p: number) {
        const t = clamp01((p - finale.orbit) / (finale.settled - finale.orbit));
        return t + 4 * t ** 3 - 7 * t ** 4 + 3 * t ** 5;
      }
      function orbitPoint(p: number, t: number, out: ThreeTypes.Vector3) {
        const transform = logoTransform(p);
        logo.yellowOrbit.getPointAt(clamp01(t), out);
        out
          .multiplyScalar(transform.scale)
          .add(finalCenter.set(finalWorldX() + transform.x, transform.y, 0));
        return out;
      }
      let motion: ReturnType<typeof createVoyageMotion> | undefined;
      let parkPoints: ThreeTypes.Vector3[] | undefined;
      let initialPoint: ThreeTypes.Vector3 | undefined;
      const motionOrigin = new THREE.Vector3(),
        motionVelocity = new THREE.Vector3();
      function ensureMotion() {
        if (!motion) {
          orbitPoint(finale.orbit, 0, motionOrigin);
          logo.yellowOrbit
            .getTangentAt(0, motionVelocity)
            .multiplyScalar(
              (logo.yellowOrbit.getLength() *
                logoTransform(finale.orbit).scale) /
                (finale.settled - finale.orbit),
            );
          motion = createVoyageMotion(
            narrow,
            motionOrigin,
            motionVelocity,
            worldStep,
            parkPoints,
            initialPoint,
            narrow ? {
              halfWidth: Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect,
              halfHeight: Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)),
              planetScale,
            } : undefined,
          );
        }
        return motion;
      }
      function positionAt(p: number, out: ThreeTypes.Vector3) {
        if (p >= finale.orbit) return orbitPoint(p, orbitTimeAt(p), out);
        return ensureMotion().positionAt(p, out);
      }
      function viewCameraXAt(p: number) {
        return voyageCameraX(p, narrow, worldStep);
      }
      const tangentB = new THREE.Vector3();
      const orientationTail = new THREE.Vector3(),
        pitchAxis = new THREE.Vector3();
      const headingRotation = new THREE.Quaternion(),
        pitchRotation = new THREE.Quaternion(),
        forwardAxis = new THREE.Vector3(0, 0, 1);
      function starScaleAt(p: number) {
        // Depth still controls occlusion, without doubling the apparent size
        // of the mobile light as it crosses the planet.
        const compensation = 1 - smoothRange(finale.start, finale.orbit, p);
        const readingScale = 0.46 * Math.min(2.2, Math.max(0.75, 360 / height));
        return narrow
          ? THREE.MathUtils.lerp(0.46, readingScale * (11 - star.position.z) / (11 - 3.2), compensation)
          : 0.47;
      }
      function orbitRotationAt(p: number, t: number, out: ThreeTypes.Euler) {
        logo.yellowOrbit.getTangentAt(clamp01(t), orbitTangent);
        return orientAlong(p, orbitTangent, out);
      }
      function orientAlong(
        p: number,
        tangent: ThreeTypes.Vector3,
        out: ThreeTypes.Euler,
      ) {
        orientationTail.copy(traveller.tail);
        const angle =
          Math.atan2(-tangent.y, -tangent.x) -
          Math.atan2(orientationTail.y, orientationTail.x);
        headingRotation.setFromAxisAngle(forwardAxis, angle);
        const planar = Math.hypot(tangent.x, tangent.y);
        const pitch =
          Math.atan2(-tangent.z, planar) -
          Math.atan2(
            orientationTail.z,
            Math.hypot(orientationTail.x, orientationTail.y),
          );
        pitchAxis.set(-tangent.y, tangent.x, 0).normalize();
        pitchRotation
          .setFromAxisAngle(pitchAxis, pitch)
          .multiply(headingRotation);
        return out.setFromQuaternion(pitchRotation);
      }
      function rotationAt(p: number, out: ThreeTypes.Euler) {
        if (p >= finale.orbit) return orbitRotationAt(p, orbitTimeAt(p), out);
        if (narrow) ensureMotion().projectedTangentAt(p, tangentB);
        else ensureMotion().tangentAt(p, tangentB);
        return orientAlong(p, tangentB, out);
      }
      function wakePointAt(p: number, out: ThreeTypes.Vector3) {
        positionAt(p, out);
        const depth = (narrow ? 11 : 16) - out.z;
        return out.set(
          (out.x - viewCameraXAt(p)) / depth,
          out.y / depth,
          out.z,
        );
      }
      const projected = new THREE.Vector3();
      let stageWidth = 1,
        stageHeight = 1,
        hostOffsetX = 0,
        hostOffsetY = 0;
      let parkedScreenPoints: { x: number; y: number }[] = [];
      const frustum = new THREE.Frustum(),
        projection = new THREE.Matrix4(),
        boundsSphere = new THREE.Sphere();
      const planetBoundingRadii = planets.groups.map((planet) => {
        planet.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(planet),
          sphere = box.getBoundingSphere(new THREE.Sphere());
        return sphere.radius + sphere.center.distanceTo(planet.position);
      });
      const planetCorners = planets.groups.map(planet => {
        planet.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(planet)
          .applyMatrix4(new THREE.Matrix4().copy(planet.matrixWorld).invert());
        return Array.from({ length: 8 }, (_, i) => new THREE.Vector3(
          i & 1 ? box.max.x : box.min.x,
          i & 2 ? box.max.y : box.min.y,
          i & 4 ? box.max.z : box.min.z,
        ));
      });
      const visibilityPoint = new THREE.Vector3();
      const planetVertices: Array<ThreeTypes.Vector3[] | null> = planets.groups.map(() => null);
      function silhouetteVertices(index: number) {
        if (planetVertices[index]) return planetVertices[index]!;
        const planet = planets.groups[index];
        const inverse = new THREE.Matrix4().copy(planet.matrixWorld).invert();
        const unique = new Map<string, ThreeTypes.Vector3>();
        const point = new THREE.Vector3();
        planet.traverse(object => {
          if (!(object instanceof THREE.Mesh) || !object.visible) return;
          const transform = new THREE.Matrix4().multiplyMatrices(inverse, object.matrixWorld);
          const positions = object.geometry.getAttribute("position");
          for (let i = 0; i < positions.count; i++) {
            point.fromBufferAttribute(positions, i).applyMatrix4(transform);
            const key = `${point.x.toFixed(5)},${point.y.toFixed(5)},${point.z.toFixed(5)}`;
            if (!unique.has(key)) unique.set(key, point.clone());
          }
        });
        return planetVertices[index] = Array.from(unique.values());
      }
      let previousFullPlanet = -1;
      let ringsEnterAt = finale.start + 0.034;
      let ringsReadyAt = finale.start + 0.049;
      let clearedNavigation = -1;
      function render() {
        frame = 0;
        if (disposed || !visible || document.hidden) return;
        const p = preference.matches ? 0.12 : clamp01(progress?.get() ?? 0);
        const navigationVisibility = navigationOpacity?.get() ?? 1;
        const state = voyageState(p),
          seal = smoothRange(finale.settled, finale.sealed, p);
        const lightTime = performance.now();
        const lightDelta = Math.min(
          0.05,
          previousLightTime ? (lightTime - previousLightTime) / 1000 : 1 / 60,
        );
        previousLightTime = lightTime;
        lightFocus +=
          (state.light - lightFocus) *
          (1 -
            Math.exp(-lightDelta / (state.light > lightFocus ? 0.11 : 0.14)));
        const focusSettled = Math.abs(state.light - lightFocus) < 0.002;
        if (focusSettled) lightFocus = state.light;
        const flight = navigationFlight?.get();
        if (flight && flight.id !== navigationId) {
          navigationId = flight.id;
          navigationCameraFrom = renderedFrames
            ? camera.position.x
            : viewCameraXAt(flight.from);
        }
        const cameraX = flight
          ? THREE.MathUtils.lerp(
              navigationCameraFrom,
              viewCameraXAt(flight.to),
              flight.amount,
            )
          : viewCameraXAt(p);
        camera.position.set(cameraX, 0, narrow ? 11 : 16);
        camera.lookAt(cameraX, 0, 0);
        key.position.set(cameraX - 5, 5, 8);
        key.target.position.set(cameraX, 0, 0);
        key.target.updateMatrixWorld();
        rim.position.set(cameraX + 5, 3, -4);
        rim.target.position.set(cameraX, 0, 0);
        rim.target.updateMatrixWorld();
        const transform = logoTransform(p);
        const ringsEnter = ringsEnterAt;
        const ringsReady = Math.min(
          finale.orbit - 0.008,
          Math.max(ringsEnterAt + 0.012, ensureMotion().logoBankAt),
        );
        ringsReadyAt = ringsReady;
        const halfView =
          Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) *
          camera.position.z *
          camera.aspect;
        const ringOffset =
          (halfView + 3 * transform.scale + 2) *
          (1 - smoothRange(ringsEnter, ringsReady, p));
        logo.group.position.set(cameraX + transform.x + ringOffset, transform.y, 0);
        logo.group.scale.setScalar(transform.scale);
        logo.group.visible = p > ringsEnter && navigationVisibility > 0;
        logo.setClosedRings(p > ringsEnter ? orbitTimeAt(p) : -1);
        logo.setFlatten(seal);
        let fullPlanet = -1;
        let shown = 0,
          nearest = -1;
        camera.updateMatrixWorld();
        projection.multiplyMatrices(
          camera.projectionMatrix,
          camera.matrixWorldInverse,
        );
        frustum.setFromProjectionMatrix(projection);
        for (let index = 0; index < planets.groups.length; index++) {
          const planet = planets.groups[index];
          planet.position.x = planetWorldX(index);
          planet.scale.setScalar(planetScale);
          const visit = visits[index];
          const halfTurn = THREE.MathUtils.degToRad(7.5);
          planet.rotation.y =
            0.15 -
            halfTurn +
            halfTurn * smoothRange(visit.start, visit.parked, p) +
            halfTurn *
              smoothRange(
                visit.departure,
                visits[index + 1]?.arrived ?? finale.orbit,
                p,
              );
          boundsSphere.center.set(planet.position.x, 0, -2);
          boundsSphere.radius = planetBoundingRadii[index] * planetScale;
          planet.visible = frustum.intersectsSphere(boundsSphere);
          if (planet.visible) {
            shown++;
            nearest = index;
            planet.updateMatrixWorld(true);
            // Include the stage's real clipping, not just the camera frustum:
            // portrait canvases extend below their composition for the light.
            const insideStage = (corner: ThreeTypes.Vector3) => {
              visibilityPoint.copy(corner).applyMatrix4(planet.matrixWorld).project(camera);
              const x = hostOffsetX + (visibilityPoint.x * 0.5 + 0.5) * width;
              const y = hostOffsetY + (-visibilityPoint.y * 0.5 + 0.5) * drawHeight;
              return visibilityPoint.z >= -1 && visibilityPoint.z <= 1 &&
                x >= 2 && x <= stageWidth - 2 && y >= 2 && y <= stageHeight - 2;
            };
            // Rings can fit while the empty corners of their bounding box do
            // not. Use cached real vertices only when the fast box test fails.
            const fullyVisible = planetCorners[index].every(insideStage) ||
              silhouetteVertices(index).every(insideStage);
            if (fullyVisible) fullPlanet = index;
          }
        }
        if (
          flight &&
          flight.id !== clearedNavigation &&
          navigationVisibility === 0 &&
          shown === 0 &&
          ((flight.to === 0 && cameraX < planetWorldX(0)) ||
            (flight.to >= finale.sealed &&
              cameraX > planetWorldX(visits.length - 1)))
        ) {
          clearedNavigation = flight.id;
          host!
            .closest("#idea")
            ?.dispatchEvent(
              new CustomEvent("voyage-endpoint-clear", { detail: flight.id }),
            );
        }
        positionAt(p, star.position);
        const parked = state.phase === "reading";
        const starScale = starScaleAt(p);
        star.scale.setScalar(starScale);
        traveller.setFocus(
          lightFocus,
          p > ringsEnter,
          seal,
          navigationVisibility,
        );
        rotationAt(p, star.rotation);
        starLight.position.copy(star.position).add(temp.set(0, 0.2, 1));
        starLight.intensity =
          (0.9 + lightFocus * 0.4 + seal * 1.2) * navigationVisibility;
        glow.position.copy(star.position);
        glow.position.z -= 0.02;
        glow.scale.setScalar(starScale * 3.2);
        glowMaterial.opacity = lightFocus * 0.38 * navigationVisibility;
        if (parked && !previousReading) wake.clear();
        previousReading = parked;
        const pixelsPerUnit =
          height / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
        const wakeLength = (narrow ? 120 : 180) / pixelsPerUnit;
        if (p >= finale.orbit || navigationVisibility === 0) {
          wake.clear();
        } else {
          if (previousOrbit)
            wake.advance(finale.orbit, wakePointAt, wakeLength);
          wake.advance(p, wakePointAt, wakeLength);
        }
        previousOrbit = p >= finale.orbit;
        wake.write(trailPositions, trailAlphas);
        for (let index = 0; index < trailCount; index++) {
          const offset = index * 3;
          // The screen-space history moves with the camera. Older samples
          // must not stay in front of a planet while the light is behind it.
          // Retain deeper samples so the tail also emerges progressively.
          trailPositions[offset + 2] = Math.min(trailPositions[offset + 2], star.position.z);
          const depth = camera.position.z - trailPositions[offset + 2];
          trailPositions[offset] = cameraX + trailPositions[offset] * depth;
          trailPositions[offset + 1] *= depth;
        }
        trailGeometry.attributes.position.needsUpdate = true;
        trailGeometry.attributes.alpha.needsUpdate = true;
        let readingTrail = 1;
        for (const visit of visits)
          if (p >= visit.parked - 0.008 && p <= visit.departure + 0.008)
            readingTrail *=
              1 -
              smoothRange(visit.parked - 0.008, visit.parked, p) +
              smoothRange(visit.departure, visit.departure + 0.008, p);
        trailMaterial.uniforms.opacity.value =
          0.38 *
          readingTrail *
          smoothRange(0, 0.008, p) *
          (1 - seal) *
          navigationVisibility *
          (1 - smoothRange(finale.orbit - 0.012, finale.orbit, p));
        renderer.render(scene, camera);
        if (sealedLogoRef.current) {
          projected.set(finalWorldX() + transform.x, transform.y, 0).project(camera);
          const x = (projected.x * 0.5 + 0.5) * width,
            y = (-projected.y * 0.5 + 0.5) * drawHeight;
          temp
            .set(finalWorldX() + transform.x + 2.4 * transform.scale, transform.y, 0)
            .project(camera);
          const size = Math.abs((temp.x - projected.x) * width);
          Object.assign(sealedLogoRef.current.style, {
            left: `${x}px`,
            top: `${y}px`,
            width: `${size}px`,
            height: `${size}px`,
            opacity: String(seal * navigationVisibility),
            filter: `blur(${(1 - seal) * 2}px)`,
          });
        }
        canvas!.style.opacity = String(1 - seal);
        canvas!.style.filter = `blur(${seal * 2}px)`;
        projected.copy(star.position).project(camera);
        const stage = host!.closest<HTMLElement>("[data-voyage-stage]");
        stage?.style.setProperty(
          "--star-x",
          `${((hostOffsetX + (projected.x * 0.5 + 0.5) * width) / stageWidth) * 100}%`,
        );
        stage?.style.setProperty(
          "--star-y",
          `${((hostOffsetY + (-projected.y * 0.5 + 0.5) * drawHeight) / stageHeight) * 100}%`,
        );
        stage?.style.setProperty(
          "--reading-light",
          String(lightFocus * navigationVisibility),
        );
        Object.assign(canvas!.dataset, {
          engine: "three.js r187",
          progress: p.toFixed(6),
          navigationVisibility: navigationVisibility.toFixed(6),
          phase: state.phase,
          planetIndex: String(shown ? nearest : -1),
          worldStep: worldStep.toFixed(5),
          cameraX: cameraX.toFixed(5),
          parkPixelX: String(parkedScreenPoints[state.index]?.x ?? ""),
          parkPixelY: String(parkedScreenPoints[state.index]?.y ?? ""),
          visiblePlanets: String(shown),
          fullyVisiblePlanet: String(fullPlanet),
          parked: String(parked),
          starX: star.position.x.toFixed(5),
          starY: star.position.y.toFixed(5),
          starZ: star.position.z.toFixed(5),
          rotation: star.rotation.z.toFixed(5),
          starScale: starScale.toFixed(5),
          trailOpacity: trailMaterial.uniforms.opacity.value.toFixed(6),
          trailLength: wake.length.toFixed(6),
          trailPixels: (wake.length * pixelsPerUnit).toFixed(3),
          trailRevision: String(wake.revision),
          trailDirection: String(wake.direction),
          tailX: trailPositions[(trailCount - 1) * 3].toFixed(5),
          tailY: trailPositions[(trailCount - 1) * 3 + 1].toFixed(5),
          tailZ: trailPositions[(trailCount - 1) * 3 + 2].toFixed(5),
          drawCalls: String(renderer.info.render.calls),
          renderedFrames: String(++renderedFrames),
          logoExact: String(seal > 0.999),
          ringsVisible: String(logo.group.visible),
          ringsOffset: ringOffset.toFixed(5),
          ringsEnter: ringsEnterAt.toFixed(6),
          ringsReady: ringsReadyAt.toFixed(6),
        });
        if (fullPlanet !== previousFullPlanet) {
          previousFullPlanet = fullPlanet;
          host!.closest("#idea")?.dispatchEvent(new Event("voyage-visibility-change"));
        }
        loadingState("ready");
        if (!focusSettled) requestRender();
      }
      function requestRender() {
        if (!frame && !disposed && visible && !document.hidden)
          frame = requestAnimationFrame(render);
      }
      let configuredTailLength = -1;
      function glyphBounds(heading: HTMLElement) {
        const range = document.createRange();
        range.selectNodeContents(heading);
        const bounds = range.getBoundingClientRect();
        const box = bounds.width > 0 && bounds.height > 0 ? bounds : heading.getBoundingClientRect();
        const transform = heading.closest<HTMLElement>("[data-voyage-copy]")?.style.transform;
        const offset = transform && transform !== "none" ? new DOMMatrixReadOnly(transform).m42 : 0;
        // The text drifts below its original baseline; its light anchor must
        // use that baseline rather than following a transient spring position.
        return new DOMRect(box.x, box.y - offset, box.width, box.height);
      }
      function measureParkPoints(rect: DOMRect) {
        const stage = host!.closest<HTMLElement>("[data-voyage-stage]");
        if (!stage) return;
        const stageRect = stage.getBoundingClientRect();
        stageWidth = stageRect.width;
        stageHeight = stageRect.height;
        hostOffsetX = rect.left - stageRect.left;
        hostOffsetY = rect.top - stageRect.top;
        const points: ThreeTypes.Vector3[] = [],
          pixels: { x: number; y: number }[] = [];
        const halfHeight =
          Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) *
          ((narrow ? 11 : 16) - 3.2);
        const heroHeading = stage.querySelector<HTMLElement>(
          '[data-voyage-copy="-1"] h1',
        );
        if (heroHeading) {
          const title = glyphBounds(heroHeading);
          if (title.width > 0 && title.height > 0) {
            const x = Math.min(
                narrow ? title.left + title.width * 0.15 : title.right + 22,
                stageRect.right - 42,
                rect.right - 42,
              ),
              y = narrow ? title.top - 26 : Math.max(
                rect.top + 26,
                Math.min(title.top - 26, rect.bottom - 26),
              );
            const point = new THREE.Vector3(
              (narrow ? 4 : 0) +
                (((x - rect.left) / rect.width) * 2 - 1) *
                  halfHeight *
                  camera.aspect,
              (1 - ((y - rect.top) / rect.height) * 2) * halfHeight,
              3.2,
            );
            if (!initialPoint || initialPoint.distanceTo(point) > 0.005) {
              initialPoint = point;
              motion = undefined;
            }
          }
        }
        for (const visit of visits) {
          const heading = stage.querySelector<HTMLElement>(
            `[data-voyage-copy="${visit.index}"] h2`,
          );
          if (!heading) return;
          const title = glyphBounds(heading);
          if (title.width < 1 || title.height < 1) return;
          const ratio = (narrow ? [0.35, 0.85, 0.2, 0.6] : [1, 0.2, 0.85, 0.5])[
            visit.index
          ];
          const titleX = narrow
            ? rect.left + rect.width * [0.26, 0.78, 0.24, 0.68][visit.index]
            : title.left + title.width * ratio + (ratio === 1 ? 22 : 0);
          const x = Math.max(
            rect.left + 42,
            Math.min(titleX, stageRect.right - 42, rect.right - 42),
          );
          const y = narrow ? title.top - 26 : Math.max(
            rect.top + 26,
            Math.min(
              title.top - [26, 34, 22, 42][visit.index],
              rect.bottom - 26,
            ),
          );
          const ndcX = ((x - rect.left) / rect.width) * 2 - 1,
            ndcY = 1 - ((y - rect.top) / rect.height) * 2;
          points.push(
            new THREE.Vector3(
              voyageCameraX(visit.parked, narrow, worldStep) +
                ndcX * halfHeight * camera.aspect,
              ndcY * halfHeight,
              3.2,
            ),
          );
          pixels.push({ x: x - stageRect.left, y: y - stageRect.top });
        }
        if (
          !parkPoints ||
          points.some(
            (point, index) => point.distanceTo(parkPoints![index]) > 0.005,
          )
        ) {
          parkPoints = points;
          motion = undefined;
        }
        parkedScreenPoints = pixels;
      }
      function resize() {
        const stage = host!.closest<HTMLElement>("[data-voyage-stage]");
        if (!stage) return;
        const stageRect = stage.getBoundingClientRect();
        const composition = voyageComposition(stageRect.width, stageRect.height);
        narrow = composition.stacked;
        short = composition.short;
        stage.dataset.voyageNarrow = String(narrow);
        stage.dataset.voyageShort = String(short);
        if (narrow) {
          const copyHeight = Math.max(...Array.from(
            stage.querySelectorAll<HTMLElement>("[data-voyage-copy], [data-voyage-final]"),
            (el) => el.getBoundingClientRect().height,
          ));
          const fitted = voyageComposition(stageRect.width, stageRect.height, copyHeight);
          stage.style.setProperty("--voyage-scene-height", `${fitted.sceneHeight}px`);
          stage.style.setProperty("--voyage-copy-top", `${fitted.copyTop}px`);
          stage.style.setProperty("--voyage-final-top", `${fitted.sceneHeight * 0.8 + 22}px`);
        }
        const rect = host!.getBoundingClientRect();
        if (rect.width < 1 || rect.height < 1) return;
        width = rect.width;
        height = rect.height;
        camera.aspect = width / height;
        camera.fov = narrow ? 42 : 38;
        drawHeight = height + (narrow ? 128 : 0);
        // Extend the canvas below the planet composition without changing its
        // projection. The light can reach the heading with its whole halo.
        if (narrow) camera.setViewOffset(width, height, 0, 0, width, drawHeight);
        else camera.clearViewOffset();
        camera.updateProjectionMatrix();
        const halfHeight = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
        planetScale = (narrow
          ? Math.min(3, Math.min(width * 0.42, height * 0.58) * 13 * halfHeight / height)
          : 1.7) * (compact ? 0.9 : 1);
        wake.clear();
        motion = undefined;
        const tailLength = 0;
        if (Math.abs(tailLength - configuredTailLength) > 0.00001) {
          logo.setOrbitTailLength(tailLength);
          configuredTailLength = tailLength;
          motion = undefined;
        }
        const maxRadius =
          Math.max(...planetBoundingRadii) * planetScale;
        const halfView =
          Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) *
          ((narrow ? 11 : 16) + 2 + maxRadius) *
          camera.aspect;
        // Keep only enough separation to show one planet at a time.
        const step = Math.max(16, 2 * halfView + 2 * maxRadius + 0.75);
        if (Math.abs(step - worldStep) > 0.001) {
          worldStep = step;
          motion = undefined;
        }
        // Wait until Neptune has completely crossed the left camera plane.
        // The rings then settle as the light reaches the lower-right bank.
        const horizontalHalfAngle = Math.atan(
          Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect,
        );
        const lastRadius =
          planetBoundingRadii.at(-1)! * planetScale;
        const clearCameraX =
          planetWorldX(visits.length - 1) +
          ((narrow ? 11 : 16) + 2) * Math.tan(horizontalHalfAngle) +
          lastRadius / Math.cos(horizontalHalfAngle);
        let low = finale.start,
          high = finale.orbit;
        for (let iteration = 0; iteration < 28; iteration++) {
          const middle = (low + high) / 2;
          if (viewCameraXAt(middle) < clearCameraX) low = middle;
          else high = middle;
        }
        ringsEnterAt = Math.max(high + 0.001, finale.start + 0.02);
        ringsReadyAt = Math.min(
          finale.orbit - 0.016,
          Math.max(finale.start + 0.049, ringsEnterAt + 0.012),
        );
        measureParkPoints(rect);
        if (stage) {
          const halfHeight = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
          const earthX =
            (planetWorldX(0) - viewCameraXAt(visits[0].parked)) /
            (((narrow ? 11 : 16) + 2) * halfHeight * camera.aspect);
          stage.style.setProperty(
            "--first-planet-x",
            `${hostOffsetX + (earthX * 0.5 + 0.5) * width}px`,
          );
          stage.style.setProperty(
            "--first-planet-y",
            `${hostOffsetY + height * 0.5}px`,
          );
        }
        renderer.setSize(width, drawHeight, false);
        canvas!.style.height = `${drawHeight}px`;
        requestRender();
      }
      function lost(event: Event) {
        event.preventDefault();
        loadingState("unavailable");
        canvas!.style.opacity = "0";
      }
      function restored() {
        loadingState("loading");
        canvas!.style.opacity = "1";
        requestRender();
      }
      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(host!);
      const observer = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible) requestRender();
      });
      observer.observe(host!);
      const unsubscribe = progress?.on("change", requestRender);
      const unsubscribeNavigation = navigationOpacity?.on(
        "change",
        requestRender,
      );
      const unsubscribeFlight = navigationFlight?.on("change", requestRender);
      document.addEventListener("visibilitychange", requestRender);
      preference.addEventListener("change", requestRender);
      canvas!.addEventListener("webglcontextlost", lost);
      canvas!.addEventListener("webglcontextrestored", restored);
      let measureFrame = 0;
      const queueMeasurement = () => {
        if (!measureFrame && !disposed)
          measureFrame = requestAnimationFrame(() => {
            measureFrame = 0;
            if (!disposed) resize();
          });
      };
      const copyObserver = new MutationObserver(queueMeasurement);
      const stage = host!.closest<HTMLElement>("[data-voyage-stage]");
      if (stage)
        copyObserver.observe(stage, {
          subtree: true,
          childList: true,
          characterData: true,
          attributes: true,
          attributeFilter: ["data-voyage-copy"],
        });
      document.fonts.addEventListener("loadingdone", queueMeasurement);
      window.addEventListener("resize", queueMeasurement);
      void document.fonts.ready.then(() => {
        if (!disposed) queueMeasurement();
      });
      resize();
      cleanup = () => {
        cancelAnimationFrame(frame);
        cancelAnimationFrame(measureFrame);
        copyObserver.disconnect();
        document.fonts.removeEventListener("loadingdone", queueMeasurement);
        window.removeEventListener("resize", queueMeasurement);
        unsubscribe?.();
        unsubscribeNavigation?.();
        unsubscribeFlight?.();
        resizeObserver.disconnect();
        observer.disconnect();
        document.removeEventListener("visibilitychange", requestRender);
        preference.removeEventListener("change", requestRender);
        canvas!.removeEventListener("webglcontextlost", lost);
        canvas!.removeEventListener("webglcontextrestored", restored);
        logo.dispose();
        traveller.dispose();
        planets.dispose();
        glowTexture.dispose();
        glowMaterial.dispose();
        trailGeometry.dispose();
        trailMaterial.dispose();
        renderer.dispose();
        renderer.forceContextLoss();
      };
    }
    void initialise().catch(() => {
      loadingState("unavailable");
    });
    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [progress, compact, navigationOpacity, navigationFlight, onStateChange]);
  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        isolation: "isolate",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          display: "block",
        }}
      />
      <div
        ref={sealedLogoRef}
        data-sealed-logo
        style={{
          position: "absolute",
          width: 200,
          height: 200,
          transform: "translate(-50%,-50%)",
          opacity: 0,
          pointerEvents: "none",
          mixBlendMode: "plus-lighter",
        }}
      >
        <Image src="/logo.svg" alt="" fill sizes="240px" />
      </div>
    </div>
  );
}
