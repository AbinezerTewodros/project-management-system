//using SixLabors.ImageSharp;
//using SixLabors.ImageSharp.Processing;
//using Ghostscript.NET.Rasterizer;

//public class ThumbnailGeneratorService : IThumbnailGeneratorService
//{
//    public bool CanProcess(string contentType) =>
//        contentType == "application/pdf";

//    public async Task<(byte[] thumbnail, string contentType)> GenerateAsync(string filePath)
//    {
//        // 1. Use Ghostscript to render first page as image
//        using var rasterizer = new GhostscriptRasterizer();
//        rasterizer.Open(filePath);

//        using var pdfPage = rasterizer.GetPage(300, 1); // 300 DPI, first page
//        using var ms = new MemoryStream();
//        pdfPage.Save(ms, System.Drawing.Imaging.ImageFormat.Png);
//        ms.Position = 0;

//        // 2. Process with ImageSharp
//        using var image = await Image.LoadAsync(ms);
//        image.Mutate(x => x.Resize(new ResizeOptions
//        {
//            Size = new Size(256, 256),
//            Mode = ResizeMode.Max
//        }));

//        // 3. Return as JPEG
//        using var output = new MemoryStream();
//        await image.SaveAsJpegAsync(output);
//        return (output.ToArray(), "image/jpeg");
//    }
//}