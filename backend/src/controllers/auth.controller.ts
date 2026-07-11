import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { WMSRepository } from '../repositories/base.repository';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const JWT_SECRET = process.env.JWT_SECRET || 'thor_wms_super_secret_key_123!';
const SESSION_EXPIRY = '24h';

export class AuthController {
  private repo: WMSRepository;

  constructor(repo: WMSRepository) {
    this.repo = repo;
  }

  login = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
      }

      const employee = await this.repo.findEmployeeByUsername(username);
      if (!employee) {
        return res.status(401).json({ error: 'Invalid username or password.' });
      }

      const match = await bcrypt.compare(password, employee.password_hash);
      if (!match) {
        return res.status(401).json({ error: 'Invalid username or password.' });
      }

      const token = jwt.sign(
        { id: employee.id, username: employee.username, role: employee.role },
        JWT_SECRET,
        { expiresIn: SESSION_EXPIRY }
      );

      // Log activity
      await this.repo.saveActivityLog({
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        employee_id: employee.id,
        action: 'LOGIN_SUCCESS',
        details: `Employee ${username} logged in.`,
        ip_address: req.ip
      });

      const settings = await this.repo.getSettingsByEmployeeId(employee.id);

      return res.status(200).json({
        token,
        employee: {
          id: employee.id,
          username: employee.username,
          full_name: employee.full_name,
          role: employee.role,
          biometric_enabled: employee.biometric_enabled
        },
        settings: settings || {
          language: 'en',
          theme: 'dark',
          scanner_beep: true,
          biometrics_enabled: false,
          sync_interval_mins: 5
        }
      });
    } catch (error: any) {
      console.error('Login error:', error);
      return res.status(500).json({ error: 'Internal server error during login.' });
    }
  };

  pinLogin = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { username, pin } = req.body;

      if (!username || !pin) {
        return res.status(400).json({ error: 'Username and PIN are required.' });
      }

      const employee = await this.repo.findEmployeeByUsername(username);
      if (!employee || !employee.pin_hash) {
        return res.status(401).json({ error: 'Invalid credentials or PIN not setup.' });
      }

      const match = await bcrypt.compare(pin, employee.pin_hash);
      if (!match) {
        return res.status(401).json({ error: 'Invalid credentials.' });
      }

      const token = jwt.sign(
        { id: employee.id, username: employee.username, role: employee.role },
        JWT_SECRET,
        { expiresIn: SESSION_EXPIRY }
      );

      await this.repo.saveActivityLog({
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        employee_id: employee.id,
        action: 'PIN_LOGIN_SUCCESS',
        details: `Employee ${username} logged in via PIN code.`,
        ip_address: req.ip
      });

      const settings = await this.repo.getSettingsByEmployeeId(employee.id);

      return res.status(200).json({
        token,
        employee: {
          id: employee.id,
          username: employee.username,
          full_name: employee.full_name,
          role: employee.role,
          biometric_enabled: employee.biometric_enabled
        },
        settings: settings || {
          language: 'en',
          theme: 'dark',
          scanner_beep: true,
          biometrics_enabled: false,
          sync_interval_mins: 5
        }
      });
    } catch (error: any) {
      console.error('PIN Login error:', error);
      return res.status(500).json({ error: 'Internal server error during PIN login.' });
    }
  };

  biometricLogin = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { employeeId } = req.body;

      if (!employeeId) {
        return res.status(400).json({ error: 'Employee ID is required.' });
      }

      const employee = await this.repo.findEmployeeById(employeeId);
      if (!employee || !employee.biometric_enabled) {
        return res.status(401).json({ error: 'Biometric authentication is not enabled for this account.' });
      }

      const token = jwt.sign(
        { id: employee.id, username: employee.username, role: employee.role },
        JWT_SECRET,
        { expiresIn: SESSION_EXPIRY }
      );

      await this.repo.saveActivityLog({
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        employee_id: employee.id,
        action: 'BIOMETRIC_LOGIN_SUCCESS',
        details: `Employee ${employee.username} logged in via biometric authentication.`,
        ip_address: req.ip
      });

      const settings = await this.repo.getSettingsByEmployeeId(employee.id);

      return res.status(200).json({
        token,
        employee: {
          id: employee.id,
          username: employee.username,
          full_name: employee.full_name,
          role: employee.role,
          biometric_enabled: employee.biometric_enabled
        },
        settings: settings || {
          language: 'en',
          theme: 'dark',
          scanner_beep: true,
          biometrics_enabled: false,
          sync_interval_mins: 5
        }
      });
    } catch (error: any) {
      console.error('Biometric Login error:', error);
      return res.status(500).json({ error: 'Internal server error during biometric login.' });
    }
  };

  getProfile = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized.' });
      }

      const employee = await this.repo.findEmployeeById(req.user.id);
      if (!employee) {
        return res.status(404).json({ error: 'Employee not found.' });
      }

      const settings = await this.repo.getSettingsByEmployeeId(employee.id);

      return res.status(200).json({
        employee: {
          id: employee.id,
          username: employee.username,
          full_name: employee.full_name,
          role: employee.role,
          biometric_enabled: employee.biometric_enabled
        },
        settings: settings || {
          language: 'en',
          theme: 'dark',
          scanner_beep: true,
          biometrics_enabled: false,
          sync_interval_mins: 5
        }
      });
    } catch (error: any) {
      console.error('Get Profile error:', error);
      return res.status(500).json({ error: 'Internal server error fetching profile.' });
    }
  };

  saveSettings = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized.' });
      }

      const { language, theme, scanner_beep, biometrics_enabled, sync_interval_mins } = req.body;

      const settings = {
        id: `settings-${req.user.id}`,
        employee_id: req.user.id,
        language,
        theme,
        scanner_beep,
        biometrics_enabled,
        sync_interval_mins
      };

      await this.repo.saveSettings(settings);

      // If biometric settings are changed, update employee model as well
      if (biometrics_enabled !== undefined) {
        const employee = await this.repo.findEmployeeById(req.user.id);
        if (employee) {
          employee.biometric_enabled = biometrics_enabled;
          await this.repo.saveEmployee(employee);
        }
      }

      return res.status(200).json({ message: 'Settings saved successfully.', settings });
    } catch (error: any) {
      console.error('Save Settings error:', error);
      return res.status(500).json({ error: 'Internal server error saving settings.' });
    }
  };
}
