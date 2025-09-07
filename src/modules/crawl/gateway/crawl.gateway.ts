import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class CrawlGateway {
  @WebSocketServer()
  server: Server;

  sendProgress(progress: any) {
    this.server.emit('crawlProgress', progress);
  }

  refreshTotalMovies(totalMovies: number) {
    this.server.emit('refreshTotalMovies', totalMovies);
  }
}
