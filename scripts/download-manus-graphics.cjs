/**
 * Download Manus AI Generated Graphics
 *
 * This script fetches completed task outputs from Manus and downloads
 * all generated images to the appropriate directories.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const MANUS_API_KEY = process.env.MANUS_API_KEY || 'sk-Y-7DlRNlRvkObQTQpiorbhhw7ND2Wz3w9un8OoF55HFW_-PTXAOe0AELHc8WHhQnhc-sNrLaWZh8tWPmUrix8IqtkT9p';

const TASK_MAPPINGS = {
  'VT6jYTx8fYZLa4YxsXjmae': {
    name: 'SHA-256 Explainer',
    dir: 'client/public/images/explainers/sha256'
  },
  'bKsM4QBq3xyJ3JkMFK4Kpu': {
    name: 'Weather Intelligence',
    dir: 'client/public/images/explainers/weather'
  },
  'AakjqpbhAvj6KJRfZoBNkT': {
    name: 'Supply Shock',
    dir: 'client/public/images/explainers/supply-shock'
  },
  'aKegzcEFVLS3WpEozu3oeX': {
    name: 'Landing Page Mockups',
    dir: 'client/public/images/landing-mockups'
  }
};

async function fetchTaskDetails(taskId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.manus.ai',
      path: `/v1/tasks/${taskId}`,
      method: 'GET',
      headers: {
        'API_KEY': MANUS_API_KEY,
        'Accept': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);

    https.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Follow redirect
        https.get(response.headers.location, (res) => {
          res.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve();
          });
        }).on('error', reject);
      } else if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      } else {
        reject(new Error(`HTTP ${response.statusCode}`));
      }
    }).on('error', reject);
  });
}

async function main() {
  console.log('Downloading Manus AI Graphics...\n');

  for (const [taskId, config] of Object.entries(TASK_MAPPINGS)) {
    console.log(`\n=== ${config.name} ===`);
    console.log(`Task ID: ${taskId}`);

    try {
      const task = await fetchTaskDetails(taskId);

      if (task.status !== 'completed') {
        console.log(`  Status: ${task.status} - skipping`);
        continue;
      }

      // Create directory
      const targetDir = path.join(__dirname, '..', config.dir);
      fs.mkdirSync(targetDir, { recursive: true });

      // Find output files
      const outputs = task.output || [];
      let downloadCount = 0;

      for (const output of outputs) {
        if (output.content) {
          for (const content of output.content) {
            if (content.type === 'output_file' && content.fileUrl) {
              const fileName = content.fileName || `image_${downloadCount + 1}.png`;
              const destPath = path.join(targetDir, fileName);

              console.log(`  Downloading: ${fileName}`);
              try {
                await downloadFile(content.fileUrl, destPath);
                console.log(`    ✓ Saved to ${config.dir}/${fileName}`);
                downloadCount++;
              } catch (err) {
                console.log(`    ✗ Failed: ${err.message}`);
              }
            }
          }
        }
      }

      console.log(`  Total downloaded: ${downloadCount} files`);

    } catch (err) {
      console.log(`  Error: ${err.message}`);
    }
  }

  console.log('\n✓ Download complete!');
}

main().catch(console.error);
