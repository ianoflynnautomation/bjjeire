package com.bjjeire.api.web;

import com.bjjeire.api.common.ApiRoutes;
import com.bjjeire.api.config.BjjEireProperties;
import io.nayuki.qrcodegen.QrCode;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping({ApiRoutes.DONATE, ApiRoutes.DONATE_LOWERCASE})
public class DonateController {
    private final BjjEireProperties properties;

    @GetMapping(value = "/bitcoin/qr", produces = "image/svg+xml")
    public ResponseEntity<String> getBitcoinQrCode() {
        QrCode qrCode = QrCode.encodeText("bitcoin:" + properties.donation().bitcoinAddress(), QrCode.Ecc.MEDIUM);

        return ResponseEntity.ok()
                .contentType(MediaType.valueOf("image/svg+xml"))
                .body(toSvg(qrCode, 4));
    }

    private static String toSvg(QrCode qrCode, int border) {
        int size = qrCode.size + border * 2;
        StringBuilder path = new StringBuilder();

        for (int y = 0; y < qrCode.size; y++) {
            for (int x = 0; x < qrCode.size; x++) {
                if (qrCode.getModule(x, y)) {
                    path.append("M")
                            .append(x + border)
                            .append(",")
                            .append(y + border)
                            .append("h1v1h-1z");
                }
            }
        }

        return """
            <?xml version="1.0" encoding="UTF-8"?>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" shape-rendering="crispEdges">
              <rect width="100%%" height="100%%" fill="#FFFFFF"/>
              <path d="%s" fill="#000000"/>
            </svg>
            """.formatted(size, size, path);
    }
}
