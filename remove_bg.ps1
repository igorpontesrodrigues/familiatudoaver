$code = @"
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;

public class ImageUtils {
    public static void RemoveWhiteBackground(string inFile, string outFile) {
        using (FileStream fs = new FileStream(inFile, FileMode.Open, FileAccess.Read)) {
            using (Image img = Image.FromStream(fs)) {
                using (Bitmap bmp = new Bitmap(img)) {
                    Bitmap result = new Bitmap(bmp.Width, bmp.Height, PixelFormat.Format32bppArgb);
                    for (int y = 0; y < bmp.Height; y++) {
                        for (int x = 0; x < bmp.Width; x++) {
                            Color c = bmp.GetPixel(x, y);
                            if (c.R > 230 && c.G > 230 && c.B > 230) {
                                result.SetPixel(x, y, Color.FromArgb(0, c.R, c.G, c.B));
                            } else {
                                result.SetPixel(x, y, c);
                            }
                        }
                    }
                    result.Save(outFile, ImageFormat.Png);
                }
            }
        }
    }
}
"@
Add-Type -TypeDefinition $code -ReferencedAssemblies System.Drawing
[ImageUtils]::RemoveWhiteBackground('C:\Users\igorr\.gemini\antigravity\brain\cbd1c00b-bb82-4290-ace7-b4a1d230859d\connecta_logo_raw_1784242785975.png', 'C:\Users\igorr\OneDrive\Desktop\Projetos\Antigravity Projects\favicon_new.png')
