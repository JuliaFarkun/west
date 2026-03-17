let speedRate = 1;

const SpeedRate = {
    set(value) {
        speedRate = value;
    },

    get() {
        return speedRate;
    }
};

export default SpeedRate;