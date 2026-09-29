import { Request, Response } from 'express';
import {
  validateTenantAndAuth,
  globalErrorHandler
} from '../backend/src/middleware/security.middleware';

describe('Pruebas Unitarias: Seguridad, Validacion de Tenant y Error Handling', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      headers: {},
      query: {},
      body: {},
      path: '/api/v1/pos/products'
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    nextFunction = jest.fn();
    delete process.env.API_KEY;
  });

  describe('Validacion de Tenant ID', () => {
    test('permite el paso cuando el tenant_id tiene formato UUID valido', () => {
      mockRequest.query = { tenant_id: '00000000-0000-0000-0000-000000000001' };
      validateTenantAndAuth(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledTimes(1);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    test('permite el paso cuando el tenant_id es alfanumerico seguro', () => {
      mockRequest.headers = { 'x-tenant-id': 'tenant_pos_local_01' };
      validateTenantAndAuth(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledTimes(1);
    });

    test('rechaza con HTTP 400 cuando el tenant_id contiene caracteres peligrosos de inyeccion', () => {
      mockRequest.query = { tenant_id: "tenant-1'; DROP TABLE usuarios; --" };
      validateTenantAndAuth(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Formato de Tenant ID invalido'
        })
      );
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('Autenticacion por API Key para Clientes Externos', () => {
    beforeEach(() => {
      process.env.API_KEY = 'secret-gestock-api-key-2026';
    });

    test('permite peticion externa cuando la cabecera X-API-Key es correcta', () => {
      mockRequest.headers = {
        'x-api-key': 'secret-gestock-api-key-2026',
        'x-tenant-id': 'tenant-test-01'
      };
      validateTenantAndAuth(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledTimes(1);
    });

    test('rechaza con HTTP 401 cuando la cabecera X-API-Key es incorrecta', () => {
      mockRequest.headers = {
        'x-api-key': 'llave-invalida-atacante',
        'x-tenant-id': 'tenant-test-01'
      };
      validateTenantAndAuth(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'API Key no autorizada o invalida'
        })
      );
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('Manejador Centralizado de Errores (Error Sanitizer)', () => {
    test('sanitiza el mensaje de error y no filtra stack trace en produccion', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const internalError = new Error('Database connection credentials failed at 192.168.1.50');
      globalErrorHandler(internalError, mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Ocurrio un error interno en el servidor'
      });

      process.env.NODE_ENV = originalEnv;
    });

    test('respeta codigos de estado HTTP personalizados si estan definidos en el error', () => {
      const customError: any = new Error('Recurso no encontrado');
      customError.status = 404;

      globalErrorHandler(customError, mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });
  });
});
