"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
let ChatGateway = class ChatGateway {
    constructor() {
        this.activeUsers = new Map();
    }
    handleConnection(client) {
        const roomId = client.handshake.query.roomId;
        const userId = client.handshake.query.userId;
        if (roomId) {
            client.join(roomId);
            this.activeUsers.set(client.id, userId);
            this.server.to(roomId).emit('userJoined', {
                userId,
                clientId: client.id,
            });
        }
    }
    handleDisconnect(client) {
        const userId = this.activeUsers.get(client.id);
        this.activeUsers.delete(client.id);
        const rooms = Object.keys(client.rooms);
        rooms.forEach(roomId => {
            if (roomId !== client.id) {
                this.server.to(roomId).emit('userLeft', {
                    userId,
                    clientId: client.id,
                });
            }
        });
    }
    handleMessage(client, data) {
        const { roomId, message, userId, userName } = data;
        this.server.to(roomId).emit('message', {
            id: Date.now().toString(),
            userId,
            userName,
            message,
            timestamp: new Date(),
        });
    }
    handleRaiseHand(client, data) {
        const { roomId, userId, userName } = data;
        this.server.to(roomId).emit('handRaised', {
            userId,
            userName,
            timestamp: new Date(),
        });
    }
    handleLowerHand(client, data) {
        const { roomId, userId } = data;
        this.server.to(roomId).emit('handLowered', {
            userId,
        });
    }
    handleWhiteboardDraw(client, data) {
        const { roomId, action } = data;
        this.server.to(roomId).emit('whiteboardUpdate', action);
    }
    handleJoinRoom(client, data) {
        client.join(data.roomId);
    }
    handleLeaveRoom(client, data) {
        client.leave(data.roomId);
    }
};
exports.ChatGateway = ChatGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], ChatGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('sendMessage'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('raiseHand'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleRaiseHand", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('lowerHand'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleLowerHand", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('whiteboardDraw'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleWhiteboardDraw", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinRoom'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleJoinRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leaveRoom'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleLeaveRoom", null);
exports.ChatGateway = ChatGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({ cors: true, namespace: '/chat' })
], ChatGateway);
//# sourceMappingURL=chat.gateway.js.map