import { Controller, Get, Put, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AdminSecurityPoliciesService, LoginPolicyDto, PasswordPolicyDto, MfaPolicyDto, IpPolicyDto } from './admin-security-policies.service';

@Controller('admin/security-policies')
export class AdminSecurityPoliciesController {
    constructor(private readonly securityPoliciesService: AdminSecurityPoliciesService) { }

    // ===============================
    // Login Policy
    // ===============================

    @Get('login')
    async getLoginPolicy() {
        return this.securityPoliciesService.getLoginPolicy();
    }

    @Put('login')
    async updateLoginPolicy(@Body() dto: LoginPolicyDto) {
        return this.securityPoliciesService.updateLoginPolicy(dto);
    }

    // ===============================
    // Password Policy
    // ===============================

    @Get('password')
    async getPasswordPolicy() {
        return this.securityPoliciesService.getPasswordPolicy();
    }

    @Put('password')
    async updatePasswordPolicy(@Body() dto: PasswordPolicyDto) {
        return this.securityPoliciesService.updatePasswordPolicy(dto);
    }

    // ===============================
    // MFA Policy
    // ===============================

    @Get('mfa')
    async getMfaPolicy() {
        return this.securityPoliciesService.getMfaPolicy();
    }

    @Put('mfa')
    async updateMfaPolicy(@Body() dto: MfaPolicyDto) {
        return this.securityPoliciesService.updateMfaPolicy(dto);
    }

    @Get('mfa/status')
    async getMfaStatus() {
        return this.securityPoliciesService.getMfaStatus();
    }

    // ===============================
    // IP Access Policy
    // ===============================

    @Get('ip')
    async getIpPolicy() {
        return this.securityPoliciesService.getIpPolicy();
    }

    @Put('ip')
    async updateIpPolicy(@Body() dto: IpPolicyDto) {
        return this.securityPoliciesService.updateIpPolicy(dto);
    }

    @Post('ip/allowed')
    async addAllowedIp(@Body('ip') ip: string) {
        return this.securityPoliciesService.addAllowedIp(ip);
    }

    @Delete('ip/allowed/:ip')
    async removeAllowedIp(@Param('ip') ip: string) {
        return this.securityPoliciesService.removeAllowedIp(ip);
    }

    @Post('ip/blocked')
    async addBlockedIp(@Body('ip') ip: string) {
        return this.securityPoliciesService.addBlockedIp(ip);
    }

    @Delete('ip/blocked/:ip')
    async removeBlockedIp(@Param('ip') ip: string) {
        return this.securityPoliciesService.removeBlockedIp(ip);
    }
}
