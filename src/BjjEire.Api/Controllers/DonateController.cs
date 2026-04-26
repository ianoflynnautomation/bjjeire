// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

using Net.Codecrete.QrCodeGenerator;

namespace BjjEire.Api.Controllers;

public class DonationOptions
{
    public string BitcoinAddress { get; init; } = string.Empty;
}

public class DonateController(IOptions<DonationOptions> options) : BaseApiController
{
    private readonly DonationOptions _options = options.Value;

    [EndpointDescription("Get Bitcoin donation address as QR code SVG")]
    [EndpointName("GetBitcoinQrCode")]
    [HttpGet("bitcoin/qr")]
    [AllowAnonymous]
    [Produces("image/svg+xml")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public IActionResult GetBitcoinQrCode()
    {
        QrCode qr = QrCode.EncodeText($"bitcoin:{_options.BitcoinAddress}", QrCode.Ecc.Medium);
        string svg = qr.ToSvgString(4);
        return Content(svg, "image/svg+xml");
    }
}
