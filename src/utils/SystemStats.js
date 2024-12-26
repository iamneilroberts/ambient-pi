import si from 'systeminformation';
import osu from 'node-os-utils';

class SystemStats {
  constructor() {
    this.lastCpuTimes = null;
    this.lastNetStats = null;
  }

  async getStats() {
    try {
      const [cpu, mem, temps, drives, net] = await Promise.all([
        this.getCpuStats(),
        this.getMemoryStats(),
        this.getTemperatures(),
        this.getDriveStats(),
        this.getNetworkStats()
      ]);

      return {
        cpu,
        mem,
        temps,
        drives,
        net,
        time: new Date()
      };
    } catch (error) {
      console.error('Error getting system stats:', error);
      return null;
    }
  }

  async getCpuStats() {
    try {
      const usage = await osu.cpu.usage();
      const { manufacturer, brand, speed, cores } = await si.cpu();
      
      return {
        usage,
        manufacturer,
        brand,
        speed,
        cores
      };
    } catch (error) {
      console.error('Error getting CPU stats:', error);
      return null;
    }
  }

  async getMemoryStats() {
    try {
      const { total, used, swaptotal, swapused } = await si.mem();
      
      return {
        total,
        used,
        swapTotal: swaptotal,
        swapUsed: swapused,
        usedPercent: (used / total) * 100,
        swapPercent: swaptotal ? (swapused / swaptotal) * 100 : 0
      };
    } catch (error) {
      console.error('Error getting memory stats:', error);
      return null;
    }
  }

  async getTemperatures() {
    try {
      const temps = await si.cpuTemperature();
      return {
        main: temps.main,
        cores: temps.cores,
        max: temps.max
      };
    } catch (error) {
      console.error('Error getting temperature:', error);
      return null;
    }
  }

  async getDriveStats() {
    try {
      const fsSize = await si.fsSize();
      return fsSize.map(fs => ({
        fs: fs.fs,
        type: fs.type,
        size: fs.size,
        used: fs.used,
        available: fs.size - fs.used,
        mount: fs.mount,
        usePercent: fs.use
      }));
    } catch (error) {
      console.error('Error getting drive stats:', error);
      return null;
    }
  }

  async getNetworkStats() {
    try {
      const networkStats = await si.networkStats();
      const primaryInterface = networkStats[0]; // Usually the main interface

      return {
        interface: primaryInterface.iface,
        rx: {
          bytes: primaryInterface.rx_bytes,
          dropped: primaryInterface.rx_dropped,
          errors: primaryInterface.rx_errors
        },
        tx: {
          bytes: primaryInterface.tx_bytes,
          dropped: primaryInterface.tx_dropped,
          errors: primaryInterface.tx_errors
        }
      };
    } catch (error) {
      console.error('Error getting network stats:', error);
      return null;
    }
  }

  async getTopProcesses(limit = 5) {
    try {
      const processes = await si.processes();
      const sorted = processes.list.sort((a, b) => b.cpu - a.cpu);
      return sorted.slice(0, limit).map(proc => ({
        name: proc.name,
        cpu: proc.cpu,
        mem: proc.mem,
        pid: proc.pid
      }));
    } catch (error) {
      console.error('Error getting top processes:', error);
      return null;
    }
  }
}

export default SystemStats;
