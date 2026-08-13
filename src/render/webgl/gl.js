export function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) || 'Shader compile failed';
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

export function createProgram(gl, vertexSource, fragmentSource) {
  const program = gl.createProgram();
  const vs = createShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  gl.attachShader(program, vs); gl.attachShader(program, fs); gl.linkProgram(program);
  gl.deleteShader(vs); gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) || 'Program link failed';
    gl.deleteProgram(program);
    throw new Error(message);
  }
  return program;
}

export function createMesh(gl, geometry) {
  const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
  const buffers = [];
  const add = (location, data, size) => {
    const buffer = gl.createBuffer(); buffers.push(buffer); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW); gl.enableVertexAttribArray(location); gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
  };
  add(0, geometry.positions, 3);
  if (geometry.normals) add(1, geometry.normals, 3);
  if (geometry.uvs) add(2, geometry.uvs, 2);
  let indexBuffer = null, count = geometry.positions.length / 3;
  if (geometry.indices) {
    indexBuffer = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geometry.indices, gl.STATIC_DRAW); count = geometry.indices.length;
  }
  gl.bindVertexArray(null);
  return { vao, buffers, indexBuffer, count, indexed: Boolean(indexBuffer) };
}

export function createPointCloud(gl, points) {
  const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
  const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer); gl.bufferData(gl.ARRAY_BUFFER, points, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0); gl.bindVertexArray(null);
  return { vao, buffer, count: points.length / 4 };
}

export function createLineMesh(gl, points) {
  const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
  const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer); gl.bufferData(gl.ARRAY_BUFFER, points, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0); gl.bindVertexArray(null);
  return { vao, buffer, count: points.length / 3 };
}

export function createTexture(gl, width, height, data, { linear = true } = {}) {
  const texture = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, linear ? gl.LINEAR : gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, linear ? gl.LINEAR : gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
  gl.bindTexture(gl.TEXTURE_2D, null); return texture;
}

export function updateTexture(gl, texture, width, height, data) {
  gl.bindTexture(gl.TEXTURE_2D, texture); gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, data); gl.bindTexture(gl.TEXTURE_2D, null);
}

export function uniform(gl, program, name, value) {
  const location = gl.getUniformLocation(program, name); if (location == null) return;
  if (typeof value === 'number') gl.uniform1f(location, value);
  else if (value.length === 16) gl.uniformMatrix4fv(location, false, value);
  else if (value.length === 4) gl.uniform4fv(location, value);
  else if (value.length === 3) gl.uniform3fv(location, value);
  else if (value.length === 2) gl.uniform2fv(location, value);
}

export function destroyMesh(gl, mesh) {
  if (!mesh) return; gl.deleteVertexArray(mesh.vao); for (const buffer of mesh.buffers || []) gl.deleteBuffer(buffer); if (mesh.buffer) gl.deleteBuffer(mesh.buffer); if (mesh.indexBuffer) gl.deleteBuffer(mesh.indexBuffer);
}
