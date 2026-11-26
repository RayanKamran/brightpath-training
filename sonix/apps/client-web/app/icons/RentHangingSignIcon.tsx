import {JSX} from 'react/jsx-runtime';

const SVGComponent = (props: JSX.IntrinsicAttributes & React.SVGProps<SVGSVGElement>) => (
  <svg id="svg" width={24} height={24} viewBox="0 0 50 50.000005" {...props}>
    <defs id="defs1" />
    <title id="title1">rent-hanging-sign</title>
    <g id="svgg" transform="matrix(0.12396289,0,0,0.12423226,0.16057287,-0.07151399)">
      <text
        xmlSpace="preserve"
        style={{
          fontSize: '107.442px',
          lineHeight: 0,
          textAlign: 'start',
          letterSpacing: 0,
          direction: 'ltr',
          textAnchor: 'start',
          fill: '#000000',
          fillOpacity: 1,
          stroke: '#000000',
        }}
        x={35.617283}
        y={322.91132}
        id="text1"
      >
        <tspan
          id="tspan1"
          x={35.617283}
          y={322.91132}
          style={{
            fontStyle: 'normal',
            fontVariant: 'normal',
            fontWeight: 'bold',
            fontStretch: 'normal',
            fontSize: '107.442px',
            fontFamily: 'Verdana',
            letterSpacing: 0,
            fill: '#000000',
            fillOpacity: 1,
            stroke: '#000000',
          }}
          dx={0}
        >
          {'RENT'}
        </tspan>
      </text>
      <ellipse
        style={{
          fill: 'none',
          fillOpacity: 1,
          stroke: '#000000',
          strokeWidth: 8.67898,
          strokeDasharray: 'none',
        }}
        id="path2"
        cx={202.39694}
        cy={38.323124}
        rx={34.793636}
        ry={33.465446}
      />
      <rect
        style={{
          fill: 'none',
          fillOpacity: 1,
          stroke: '#000000',
          strokeWidth: 15.4475,
          strokeDasharray: 'none',
        }}
        id="rect2"
        width={387.72076}
        height={211.65895}
        x={6.4873123}
        y={178.02396}
        ry={54.049679}
        rx={42.013386}
      />
      <path
        style={{
          fill: '#ff0000',
          fillOpacity: 1,
          stroke: '#000000',
          strokeWidth: 13,
          strokeDasharray: 'none',
        }}
        d="M 69.128417,175.95757 178.07255,64.665504"
        id="path3"
      />
      <path
        style={{
          fill: '#ff0000',
          fillOpacity: 1,
          stroke: '#000000',
          strokeWidth: 13,
          strokeDasharray: 'none',
        }}
        d="M 337.00119,176.06133 228.05707,64.769264"
        id="path3-8"
      />
    </g>
  </svg>
);
export default SVGComponent;
