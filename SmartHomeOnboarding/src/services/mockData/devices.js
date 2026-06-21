export const DEVICE_CATEGORIES = [
  { id: 'sensors', label: 'Sensors', icon: 'radio-outline', accent: '#5856D6' },
  { id: 'plugs', label: 'Smart Plugs', icon: 'flash-outline', accent: '#FF9500' },
  { id: 'cameras', label: 'Cameras', icon: 'camera-outline', accent: '#007AFF' },
  { id: 'bulbs', label: 'Smart Bulbs', icon: 'bulb-outline', accent: '#FFD60A' },
];

export const MOCK_DEVICES_BY_CATEGORY = {
  sensors: [
    { id: 's1', name: 'Motion Sensor #1' },
    { id: 's2', name: 'Door Sensor #1' },
    { id: 's3', name: 'Temperature Sensor #1' },
  ],
  plugs: [
    { id: 'p1', name: 'Smart Plug #1' },
    { id: 'p2', name: 'Smart Plug #2' },
  ],
  cameras: [
    { id: 'c1', name: 'Camera #1 · Indoor' },
    { id: 'c2', name: 'Camera #2 · Outdoor' },
  ],
  bulbs: [
    { id: 'b1', name: 'Bulb #1 · Ceiling' },
    { id: 'b2', name: 'Bulb #2 · Desk' },
    { id: 'b3', name: 'Bulb #3 · Corner' },
  ],
};

export const DEVICE_CONFIGS = {
  bulbs: {
    label: 'Smart Bulbs', icon: 'bulb-outline', accent: '#FFD60A',
    actions: [
      { id: 'bulb_on', label: 'Turn On' },
      { id: 'bulb_off', label: 'Turn Off' },
      { id: 'bulb_bright_up', label: 'Increase Brightness' },
      { id: 'bulb_bright_down', label: 'Decrease Brightness' },
    ],
  },
  plugs: {
    label: 'Smart Plugs', icon: 'flash-outline', accent: '#FF9500',
    actions: [
      { id: 'plug_on', label: 'Turn On' },
      { id: 'plug_off', label: 'Turn Off' },
      { id: 'plug_toggle', label: 'Toggle Power' },
    ],
  },
  cameras: {
    label: 'Cameras', icon: 'camera-outline', accent: '#007AFF',
    actions: [
      { id: 'cam_record', label: 'Start Recording' },
      { id: 'cam_snapshot', label: 'Take Snapshot' },
      { id: 'cam_toggle', label: 'Toggle Camera' },
    ],
  },
  sensors: {
    label: 'Sensors', icon: 'radio-outline', accent: '#5856D6',
    actions: [
      { id: 'sensor_arm', label: 'Arm Sensor' },
      { id: 'sensor_disarm', label: 'Disarm Sensor' },
    ],
  },
};

export const AVAILABLE_GESTURES = [
  { id: 'thumbs_up', label: 'Thumbs Up', icon: 'thumbs-up-outline' },
  { id: 'thumbs_down', label: 'Thumbs Down', icon: 'thumbs-down-outline' },
  { id: 'open_palm', label: 'Open Palm', icon: 'hand-right-outline' },
  { id: 'closed_fist', label: 'Closed Fist', icon: 'hand-left-outline' },
  { id: 'peace_sign', label: 'Peace Sign', icon: 'finger-print-outline' },
  { id: 'point_up', label: 'Point Up', icon: 'arrow-up-outline' },
  { id: 'point_down', label: 'Point Down', icon: 'arrow-down-outline' },
  { id: 'wave', label: 'Wave', icon: 'swap-horizontal-outline' },
  { id: 'ok_sign', label: 'OK Sign', icon: 'checkmark-circle-outline' },
];

export const SOS_TRIGGERS = [
  { id: 'closed_fist', label: 'Closed Fist', icon: 'hand-left-outline' },
  { id: 'open_palm', label: 'Open Palm', icon: 'hand-right-outline' },
  { id: 'peace_sign', label: 'Peace Sign', icon: 'finger-print-outline' },
  { id: 'thumbs_down', label: 'Thumbs Down', icon: 'thumbs-down-outline' },
  { id: 'wave', label: 'Wave', icon: 'swap-horizontal-outline' },
];

export const SOS_CANCELS = [
  { id: 'open_palm', label: 'Open Palm', icon: 'hand-right-outline' },
  { id: 'thumbs_up', label: 'Thumbs Up', icon: 'thumbs-up-outline' },
  { id: 'wave', label: 'Wave', icon: 'swap-horizontal-outline' },
  { id: 'ok_sign', label: 'OK Sign', icon: 'checkmark-circle-outline' },
];

export const ALERT_COLORS = [
  { id: 'red', hex: '#E53935', label: 'Red' },
  { id: 'orange', hex: '#FB8C00', label: 'Orange' },
  { id: 'blue', hex: '#1E88E5', label: 'Blue' },
  { id: 'green', hex: '#43A047', label: 'Green' },
  { id: 'purple', hex: '#8E24AA', label: 'Purple' },
  { id: 'white', hex: '#F5F5F5', label: 'White' },
];

export const DURATIONS = ['5 sec', '10 sec', '15 sec'];

export const LIGHT_COLORS = [
  { id: 'warm', hex: '#FFD54F', label: 'Warm' },
  { id: 'cool', hex: '#81D4FA', label: 'Cool' },
  { id: 'daylight', hex: '#FFF9C4', label: 'Day' },
  { id: 'red', hex: '#EF5350', label: 'Red' },
  { id: 'green', hex: '#66BB6A', label: 'Green' },
  { id: 'blue', hex: '#42A5F5', label: 'Blue' },
  { id: 'purple', hex: '#AB47BC', label: 'Purple' },
];
