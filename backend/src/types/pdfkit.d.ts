declare module 'pdfkit' {
  import { Readable } from 'stream';

  class PDFDocument extends Readable {
    constructor();
    on(event: 'data', listener: (chunk: Buffer) => void): this;
    on(event: 'end', listener: () => void): this;
    on(event: 'error', listener: (err: Error) => void): this;
    fontSize(size: number): this;
    text(text: string, options?: { align?: 'center' | 'left' | 'right' }): this;
    moveDown(lines?: number): this;
    end(): void;
  }

  export default PDFDocument;
}
