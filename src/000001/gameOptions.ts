export const gameOptions = {
    // slices configuration
    slices: [
        {
            startColor: 0xff0000,
            endColor: 0xff8800,
            rings: 3,
            text: "RED/ORANGE"
        },
        {
            startColor: 0x00ff00,
            endColor: 0x004400,
            rings: 200,
            text: "GREEN"
        },
        {
            startColor: 0xff00ff,
            endColor: 0x0000ff,
            rings: 10,
            text: "PURPLE/BLUE"
        },
        {
            startColor: 0x666666,
            endColor: 0x999999,
            rings: 200,
            text: "GREY"
        },
        {
            startColor: 0x000000,
            endColor: 0xffff00,
            rings: 1,
            text: "YELLOW"
        }
    ],

    // wheel rotation duration range, in milliseconds
    rotationTimeRange: {
        min: 3000,
        max: 4500
    },

    // wheel rounds before it stops
    wheelRounds: {
        min: 2,
        max: 11
    },

    // degrees the wheel will rotate in the opposite direction before it stops
    backSpin: {
        min: 1,
        max: 4
    },

    // wheel radius, in pixels
    wheelRadius: 240,

    // color of stroke lines
    strokeColor: 0xffffff,

    // width of stroke lines
    strokeWidth: 5
}