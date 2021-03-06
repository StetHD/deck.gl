import React, {Component} from 'react';

import DeckGL, {PolygonLayer} from 'deck.gl';

import {MAPBOX_STYLES} from '../../constants/defaults';
import {readableInteger} from '../../utils/format-utils';
import ViewportAnimation from '../../utils/map-utils';
import TripsLayer from '../../../../examples/sample-layers/trips-layer';

const LIGHT_SETTINGS = {
  lightsPosition: [-74.05, 40.7, 8000, -73.5, 41, 5000],
  ambientRatio: 0.05,
  diffuseRatio: 0.6,
  specularRatio: 0.8,
  lightsStrength: [2.0, 0.0, 0.0, 0.0],
  numberOfLights: 2
};

export default class TripsDemo extends Component {

  static get data() {
    return [
      {
        url: 'data/trips-data.txt',
        worker: 'workers/trips-data-decoder.js?loop=1800&trail=180'
      },
      {
        url: 'data/building-data.txt',
        worker: 'workers/building-data-decoder.js'
      }
    ];
  }

  static get parameters() {
    return {
      trail: {displayName: 'Trail', type: 'number', value: 180, step: 10, min: 10, max: 180}
    };
  }

  static get viewport() {
    return {
      mapStyle: MAPBOX_STYLES.DARK,
      longitude: -74,
      latitude: 40.72,
      zoom: 13,
      maxZoom: 16,
      pitch: 45,
      bearing: 0
    };
  }

  static renderInfo(meta) {
    return (
      <div>
        <h3>Yellow Cab Vs. Green Cab Trips in Manhattan</h3>
        <p>June 16, 2016 21:00 - 21:30</p>
        <p>Trip data source:&nbsp;
          <a href="http://www.nyc.gov/html/tlc/html/about/trip_record_data.shtml">
          NYC Taxi & Limousine Commission Trip Records</a>
        </p>
        <p>Building data source:&nbsp;
          <a href="http://openstreetmap.org">OpenStreetMap</a> via&nbsp;
          <a href="https://mapzen.com/">Mapzen Vector Tiles API</a>
        </p>
        <div className="layout">
          <div className="stat col-1-2">Trips
            <b>{ readableInteger(meta.trips || 0) }</b>
          </div>
          <div className="stat col-1-2">Buildings
            <b>{ readableInteger(meta.buildings || 0) }</b>
          </div>
        </div>
        <div className="layout">
          <div className="stat col-1-2">Vertices
            <b>{ readableInteger((meta.vertices || 0) + (meta.triangles || 0) * 3) }</b>
          </div>
        </div>
      </div>
    );
  }

  constructor(props) {
    super(props);

    this.state = {time: 0};

    const thisDemo = this; // eslint-disable-line

    this.tween = ViewportAnimation.ease({time: 0}, {time: 1800}, 60000)
      .onUpdate(function tweenUpdate() {
        thisDemo.setState(this); // eslint-disable-line
      })
      .repeat(Infinity);
  }

  componentDidMount() {
    this.tween.start();
  }

  componentWillUnmount() {
    this.tween.stop();
  }

  _initialize(gl) {
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
  }

  render() {
    const {viewport, data, params} = this.props;

    if (!data) {
      return null;
    }

    const layers = [].concat(
      data[0] && data[0].map((layerData, layerIndex) => new TripsLayer({
        id: `trips-${layerIndex}`,
        data: layerData,
        getPath: d => d.segments,
        getColor: d => d.vendor === 0 ? [253, 128, 93] : [23, 184, 190],
        opacity: 0.3,
        strokeWidth: 2,
        trailLength: params.trail.value,
        currentTime: this.state.time
      })),
      data[1] && new PolygonLayer({
        id: `buildings`,
        data: data[1],
        extruded: true,
        wireframe: false,
        fp64: true,
        opacity: 0.5,
        getPolygon: f => f.polygon,
        getElevation: f => f.height,
        getFillColor: f => [74, 80, 87],
        lightSettings: LIGHT_SETTINGS
      })
    ).filter(Boolean);

    return (
      <DeckGL {...viewport} layers={layers} onWebGLInitialized={this._initialize} />
    );
  }
}
