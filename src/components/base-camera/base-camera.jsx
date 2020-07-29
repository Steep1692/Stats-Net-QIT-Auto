/**
 * @license
 * Copyright 2020 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */

import React, { useRef, useEffect, useState } from 'react'
import * as styles from './base-camera.module.css'
import * as facemesh from '@tensorflow-models/facemesh';
import * as tf from '@tensorflow/tfjs-core';
import * as tfjsWasm from '@tensorflow/tfjs-backend-wasm';
import { version } from '@tensorflow/tfjs-backend-wasm/dist/version';
import { TRIANGULATION } from './triangulation';

tfjsWasm.setWasmPath(
  `https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm@${version}/dist/tfjs-backend-wasm.wasm`
);

const BaseCamera = ({ onCapture }) => {
  const cam = useRef(null)
  const video = useRef(null)
  const [isCameraInited, setIsCameraInited] = useState(false)

  const capture = () => {
    const videoElement = video.current

    const canvas = document.createElement("canvas")
    canvas.width = videoElement.videoWidth
    canvas.height = videoElement.videoHeight
    canvas.getContext('2d')
      .drawImage(videoElement, 0, 0, canvas.width, canvas.height)

    const dataURL = canvas.toDataURL()

    onCapture(dataURL)
  }

  useEffect(() => {
    function isMobile() {
      const isAndroid = /Android/i.test(navigator.userAgent);
      const isiOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      return isAndroid || isiOS;
    }

    function drawPath(ctx, points, closePath) {
      const region = new Path2D();
      region.moveTo(points[0][0], points[0][1]);
      for (let i = 1; i < points.length; i++) {
        const point = points[i];
        region.lineTo(point[0], point[1]);
      }

      if (closePath) {
        region.closePath();
      }
      ctx.stroke(region);
    }

    let model, ctx, videoWidth, videoHeight, video, canvas, stream

    const mobile = isMobile();
    // Don't render the point cloud on mobile in order to maximize performance and
    // to avoid crowding limited screen space.
    const renderPointcloud = mobile === false;
    const state = {
      backend: 'wasm',
      maxFaces: 1,
      triangulateMesh: true
    };

    if (renderPointcloud) {
      state.renderPointcloud = true;
    }

    async function setupCamera() {
      video = document.getElementById('js-face-mesh-original');
      const VIDEO_SIZE = video.width;

      stream = await navigator.mediaDevices.getUserMedia({
        'audio': false,
        'video': {
          facingMode: 'user',
          width: VIDEO_SIZE,
          height: VIDEO_SIZE
        },
      });

      video.srcObject = stream;

      return new Promise((resolve) => {
        video.onloadedmetadata = () => {
          resolve(video);
        };
      });
    }

    async function renderPrediction() {
      if (model) {
        const predictions = await model.estimateFaces(video);
        ctx.drawImage(
          video, 0, 0, videoWidth, videoHeight, 0, 0, canvas.width, canvas.height);

        if (predictions.length > 0) {
          predictions.forEach(prediction => {
            const keypoints = prediction.scaledMesh;

            if (state.triangulateMesh) {
              for (let i = 0; i < TRIANGULATION.length / 3; i++) {
                const points = [
                  TRIANGULATION[i * 3], TRIANGULATION[i * 3 + 1],
                  TRIANGULATION[i * 3 + 2]
                ].map(index => keypoints[index]);

                drawPath(ctx, points, true);
              }
            } else {
              for (let i = 0; i < keypoints.length; i++) {
                const x = keypoints[i][0];
                const y = keypoints[i][1];

                ctx.beginPath();
                ctx.arc(x, y, 1 /* radius */, 0, 2 * Math.PI);
                ctx.fill();
              }
            }
          });

          if (renderPointcloud && state.renderPointcloud) {
            const pointsData = predictions.map(prediction => {
              let scaledMesh = prediction.scaledMesh;
              return scaledMesh.map(point => ([-point[0], -point[1], -point[2]]));
            });

            let flattenedPointsData = [];
            for (let i = 0; i < pointsData.length; i++) {
              flattenedPointsData = flattenedPointsData.concat(pointsData[i]);
            }

          }
        }

        requestAnimationFrame(renderPrediction);
      }
    };

    async function main() {
      await tf.setBackend(state.backend);

      await setupCamera();
      video.play();
      videoWidth = video.videoWidth;
      videoHeight = video.videoHeight;
      video.width = videoWidth;
      video.height = videoHeight;

      canvas = document.getElementById('js-face-mesh-output');
      canvas.width = videoWidth;
      canvas.height = videoHeight;

      ctx = canvas.getContext('2d');
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.fillStyle = '#32EEDB';
      ctx.strokeStyle = '#32EEDB';
      ctx.lineWidth = 0.5;

      model = await facemesh.load({ maxFaces: state.maxFaces });
      renderPrediction();

      return true;
    };

    main()
      .then(() => {
        setIsCameraInited(true)
      })

    return () => {
      stream.getTracks().forEach(function (track) {
        track.stop();
      });

      model = null
      ctx = null
      videoWidth = null
      videoHeight = null
      video = null
      canvas = null
      stream = null
    }
  }, [])

  return (
    <div className={styles.cameraWrapper}>
      <video ref={video} id="js-face-mesh-original" style={{ display: 'none' }} />

      <canvas
        className={`${styles.cameraCanvas} ${(isCameraInited) ? styles.inited : ''}`}
        id="js-face-mesh-output"
        ref={cam}
      />

      {
        (isCameraInited)
          ? <button className={styles.buttonCapture} onClick={capture} />
          : <p className={styles.cameraLabel}>Камера инициализируется....</p>
      }

    </div>
  )
}

export default BaseCamera