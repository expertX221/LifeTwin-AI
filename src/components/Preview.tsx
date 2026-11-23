import {MetricScene,animations} from './MetricScene'
export default function Preview(){return <MetricScene metricKey="Heart" modelPath="/models/heart.glb" animate={animations.Heart} summary="Interactive cardiac anatomy preview"/>}
