export interface IRenderable {
  getDimension(): Dimension;
}

export interface Dimension {
  top: number;
  left: number;
  width: number;
  height: number;
}

export const DimensionUtils = {
  toString: (dim: Dimension) => {
    return {top: dim.top + 'px', left: dim.left + 'px', width: dim.width + 'px', height: dim.height + 'px'};
  }
};
