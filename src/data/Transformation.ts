class Transformation {
  translation: number[];
  rotation: number[];
  scale: number[];

  constructor(translation?: number[], rotation?: number[], scale?: number[]) {
    if (!translation) {
      translation = [0, 0, 0];
    }
    if (!rotation) {
      rotation = [0, 0, 0];
    }
    if (!scale) {
      scale = [1, 1, 1];
    }
    this.translation = translation;
    this.rotation = rotation;
    this.scale = scale;
  }

  copy(): Transformation {
    return new Transformation([...this.translation], [...this.rotation], [...this.scale]);
  }
}

export default Transformation;