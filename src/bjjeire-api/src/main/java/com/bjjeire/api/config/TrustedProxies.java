package com.bjjeire.api.config;

import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

final class TrustedProxies {
    private static final Pattern IPV4 = Pattern.compile("(\\d{1,3})\\.(\\d{1,3})\\.(\\d{1,3})\\.(\\d{1,3})");

    private TrustedProxies() {}

    static boolean trusts(String remoteAddress, List<String> trusted) {
        if (remoteAddress == null || remoteAddress.isBlank() || trusted == null || trusted.isEmpty()) {
            return false;
        }
        for (String entry : trusted) {
            if (entry == null || entry.isBlank()) {
                continue;
            }
            String candidate = entry.trim();
            if (candidate.equals(remoteAddress)) {
                return true;
            }
            int slash = candidate.indexOf('/');
            if (slash > 0
                    && matchesIpv4Cidr(remoteAddress, candidate.substring(0, slash), candidate.substring(slash + 1))) {
                return true;
            }
        }
        return false;
    }

    private static boolean matchesIpv4Cidr(String ip, String network, String prefixText) {
        int address = ipv4(ip);
        int base = ipv4(network);
        if (address < 0 || base < 0) {
            return false;
        }
        int prefix;
        try {
            prefix = Integer.parseInt(prefixText);
        } catch (NumberFormatException exception) {
            return false;
        }
        if (prefix < 0 || prefix > 32) {
            return false;
        }
        int mask = prefix == 0 ? 0 : 0xFFFFFFFF << (32 - prefix);
        return (address & mask) == (base & mask);
    }

    private static int ipv4(String value) {
        Matcher matcher = IPV4.matcher(value);
        if (!matcher.matches()) {
            return -1;
        }
        int address = 0;
        for (int octet = 1; octet <= 4; octet++) {
            int part = Integer.parseInt(matcher.group(octet));
            if (part > 255) {
                return -1;
            }
            address = (address << 8) | part;
        }
        return address;
    }
}
