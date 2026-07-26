package com.bjjeire.api.web;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.bjjeire.api.common.ApiRoutes;
import com.bjjeire.api.config.BjjEireProperties;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class DonateControllerTest {
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        BjjEireProperties properties = new BjjEireProperties(
                null, null, new BjjEireProperties.Donation("bc1qbjjeiretestaddress"), null, null, Map.of());

        mockMvc = MockMvcBuilders.standaloneSetup(new DonateController(properties))
                .build();
    }

    @Test
    void shouldRenderSvgQrCodeWhenGettingBitcoinQr() throws Exception {
        mockMvc.perform(get(ApiRoutes.DONATE + "/bitcoin/qr"))
                .andExpect(status().isOk())
                .andExpect(content().contentType("image/svg+xml"))
                .andExpect(content().string(containsString("<svg")))
                .andExpect(content().string(containsString("<path")));
    }
}
