class TRIP {
    constructor(data) {
        const self = this;
        //#region INITIALIZATION
        self.key = data.key;
        self.origin = data.origin;
        self.originAddress = data.originAddress;
        self.destination = data.destination;
        self.destinationAddress = data.destinationAddress;
        self.riderKey = data.riderKey;
        self.riderName = data.riderName;
        self.driverKey = data.driverKey;
        self.driverName = data.driverName;
        self.distance = data.distance;
        self.duration = data.duration;
        self.state = data.state;
        self.timestamp = data.timestamp;
        //#endregion
    }
}

export default TRIP;
