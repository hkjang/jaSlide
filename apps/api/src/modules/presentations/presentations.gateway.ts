import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
    namespace: '/presentations',
})
export class PresentationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly logger = new Logger(PresentationsGateway.name);

    @WebSocketServer()
    server: Server;

    // Track connected users per presentation
    private rooms: Map<string, Set<string>> = new Map();

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
        // Remove from all rooms
        this.rooms.forEach((users, room) => {
            if (users.has(client.id)) {
                users.delete(client.id);
                this.server.to(room).emit('user-left', { socketId: client.id });
            }
        });
    }

    @SubscribeMessage('join-presentation')
    handleJoin(
        @MessageBody() data: { presentationId: string; userId: string; userName?: string },
        @ConnectedSocket() client: Socket,
    ) {
        const { presentationId, userId, userName } = data;
        const roomId = `presentation:${presentationId}`;

        // Join room
        client.join(roomId);

        // Track user
        if (!this.rooms.has(roomId)) {
            this.rooms.set(roomId, new Set());
        }
        this.rooms.get(roomId)!.add(client.id);

        // Notify others
        client.to(roomId).emit('user-joined', {
            socketId: client.id,
            userId,
            userName: userName || 'Anonymous',
        });

        // Return current users
        const users = Array.from(this.rooms.get(roomId) || []);
        return { event: 'joined', data: { roomId, users: users.length } };
    }

    @SubscribeMessage('leave-presentation')
    handleLeave(
        @MessageBody() data: { presentationId: string },
        @ConnectedSocket() client: Socket,
    ) {
        const roomId = `presentation:${data.presentationId}`;

        client.leave(roomId);
        this.rooms.get(roomId)?.delete(client.id);

        client.to(roomId).emit('user-left', { socketId: client.id });

        return { event: 'left', data: { roomId } };
    }

    @SubscribeMessage('slide-update')
    handleSlideUpdate(
        @MessageBody() data: { presentationId: string; slideId: string; changes: any },
        @ConnectedSocket() client: Socket,
    ) {
        const roomId = `presentation:${data.presentationId}`;

        // Broadcast to others in the room
        client.to(roomId).emit('slide-updated', {
            slideId: data.slideId,
            changes: data.changes,
            updatedBy: client.id,
        });

        return { event: 'update-sent' };
    }

    @SubscribeMessage('slide-select')
    handleSlideSelect(
        @MessageBody() data: { presentationId: string; slideId: string },
        @ConnectedSocket() client: Socket,
    ) {
        const roomId = `presentation:${data.presentationId}`;

        // Broadcast cursor position
        client.to(roomId).emit('user-selected-slide', {
            socketId: client.id,
            slideId: data.slideId,
        });

        return { event: 'selection-sent' };
    }

    @SubscribeMessage('slide-reorder')
    handleSlideReorder(
        @MessageBody() data: { presentationId: string; slideIds: string[] },
        @ConnectedSocket() client: Socket,
    ) {
        const roomId = `presentation:${data.presentationId}`;

        client.to(roomId).emit('slides-reordered', {
            slideIds: data.slideIds,
            reorderedBy: client.id,
        });

        return { event: 'reorder-sent' };
    }

    @SubscribeMessage('cursor-move')
    handleCursorMove(
        @MessageBody() data: { presentationId: string; x: number; y: number },
        @ConnectedSocket() client: Socket,
    ) {
        const roomId = `presentation:${data.presentationId}`;

        client.to(roomId).emit('cursor-moved', {
            socketId: client.id,
            x: data.x,
            y: data.y,
        });
    }
}
