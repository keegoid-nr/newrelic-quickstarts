'use strict';

const path = require('path');
const { expect } = require('@jest/globals');

const {
  getQuickstartConfigPaths,
  buildMutationVariables,
  getGraphqlRequests,
  countErrors,
} = require('../create_validate_pr_quickstarts');

const {
  mockGitHubResponseFilenames,
  addFilenameObject,
} = require('./test-utilities');

const helpers = require('../helpers');

jest.mock('../nr-graphql-helpers');
jest.mock('../helpers', () => ({
  ...jest.requireActual('../helpers'),
  passedProcessArguments: jest.fn(),
}));

const mockDashboardRawConfigurationJSON = require('../mock_files/mock_dashboard_config.json');
const mockDashboardRawConfiguration = JSON.stringify(
  mockDashboardRawConfigurationJSON
);

const buildFullQuickstartFilePaths = (relativePaths) => {
  return relativePaths.map((relativePath) => {
    return path.resolve(process.cwd(), `..${relativePath}`);
  });
};

const quickstartNames = new Set([
  'aws-ec2',
  'infrastructure',
  'python/aiohttp',
  'python/pysqlite',
  'postgresql',
]);

const quickstartConfigRelativePaths = [
  '/quickstarts/aws/aws-ec2/config.yml',
  '/quickstarts/infrastructure/config.yml',
  '/quickstarts/python/aiohttp/config.yml',
  '/quickstarts/python/pysqlite/config.yml',
  '/quickstarts/postgresql/config.yml',
];

const expectedQuickstartConfigFullPaths = buildFullQuickstartFilePaths(
  quickstartConfigRelativePaths
);

const expectedMockQuickstart2MutationInput = {
  id: 'mock-2-id',
  dryRun: true,
  quickstartMetadata: {
    authors: [{ name: 'John Smith' }],
    categoryTerms: undefined,
    description:
      'The template quickstart allows you to get visibility into the performance and available of your example service and dependencies. Use this quickstart together with the mock up integrations.',
    displayName: 'Template Quickstart',
    documentation: [
      {
        displayName: 'Installation Docs',
        url: 'docs.newrelic.com',
        description: 'Description about this doc reference',
      },
    ],
    icon: 'https://raw.githubusercontent.com/newrelic/newrelic-quickstarts/main/utils/mock_files/mock-quickstart-2/logo.png',
    keywords: ['list', 'of', 'searchable', 'keywords'],
    sourceUrl:
      'https://github.com/newrelic/newrelic-quickstarts/tree/main/utils/mock_files/mock-quickstart-2',
    summary: 'A short form description for this quickstart',
    supportLevel: 'COMMUNITY',
    installPlanStepIds: ['infra-agent-targeted'],
    alertConditions: [
      {
        description:
          "This alert triggers when the reported health of an Elasticsearch cluster is 'red'.",
        displayName: 'Cluster Health',
        rawConfiguration:
          '{"name":"Cluster Health","description":"This alert triggers when the reported health of an Elasticsearch cluster is \'red\'.\\n","type":"STATIC","nrql":{"query":"FROM ElasticsearchClusterSample SELECT uniqueCount(displayName) WHERE cluster.status = \'red\' FACET displayName"},"valueFunction":"SINGLE_VALUE","terms":[{"priority":"CRITICAL","operator":"ABOVE","threshold":0,"thresholdDuration":300,"thresholdOccurrences":"AT_LEAST_ONCE"}],"violationTimeLimitSeconds":86400}',
        type: 'STATIC',
        sourceUrl:
          'https://github.com/newrelic/newrelic-quickstarts/tree/main/utils/mock_files/mock-quickstart-2/alerts/Cluster Health.yml',
      },
      {
        description:
          'This alert fires when 10 percent of the transactions against an application end with an error, over a period of 5 minutes.',
        displayName: 'Errors',
        rawConfiguration:
          '{"name":"Errors","description":"This alert fires when 10 percent of the transactions against an application end with an error, over a period of 5 minutes.\\n","type":"STATIC","nrql":{"query":"from Transaction select percentage(count(*), where error is not false) as \'Errors\' where transactionType = \'Web\' facet appName"},"valueFunction":"SINGLE_VALUE","terms":[{"priority":"CRITICAL","operator":"ABOVE","threshold":10,"thresholdDuration":300,"thresholdOccurrences":"ALL"}],"expiration":{"closeViolationsOnExpiration":true,"openViolationOnExpiration":false,"expirationDuration":86400},"violationTimeLimitSeconds":86400}',
        type: 'STATIC',
        sourceUrl:
          'https://github.com/newrelic/newrelic-quickstarts/tree/main/utils/mock_files/mock-quickstart-2/alerts/errors.yml',
      },
    ],
    dashboards: [
      {
        description: '.NET',
        displayName: '.NET',
        rawConfiguration: mockDashboardRawConfiguration,
        sourceUrl:
          'https://github.com/newrelic/newrelic-quickstarts/tree/main/utils/mock_files/mock-quickstart-2/dashboards/dotnet/dotnet.json',
        screenshots: [
          {
            url: 'https://raw.githubusercontent.com/newrelic/newrelic-quickstarts/main/utils/mock_files/mock-quickstart-2/dashboards/dotnet/dotnet.png',
          },
          {
            url: 'https://raw.githubusercontent.com/newrelic/newrelic-quickstarts/main/utils/mock_files/mock-quickstart-2/dashboards/dotnet/dotnet02.png',
          },
          {
            url: 'https://raw.githubusercontent.com/newrelic/newrelic-quickstarts/main/utils/mock_files/mock-quickstart-2/dashboards/dotnet/dotnet03.png',
          },
        ],
      },
    ],
  },
};

const expectedMockQuickstart4MutationInput = {
  id: '00000000-0000-0000-0000-000000000000',
  dryRun: true,
  quickstartMetadata: {
    sourceUrl:
      'https://github.com/newrelic/newrelic-quickstarts/tree/main/utils/mock_files/mock-quickstart-4',
    alertConditions: undefined,
    authors: undefined,
    categoryTerms: undefined,
    dashboards: undefined,
    description: undefined,
    displayName: undefined,
    documentation: undefined,
    icon: undefined,
    installPlanStepIds: undefined,
    keywords: undefined,
    sourceUrl:
      'https://github.com/newrelic/newrelic-quickstarts/tree/main/utils/mock_files/mock-quickstart-4',
    summary: undefined,
  },
};

describe('quickstart submission and validation', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('getQuickstartConfigPaths returns list of unique quickstart config filepaths', () => {
    const configPaths = getQuickstartConfigPaths(quickstartNames);

    expect(configPaths).toEqual(expectedQuickstartConfigFullPaths);
  });

  test('buildMutationVariables returns expected mutation input from quickstart config', () => {
    const processArgs = ['url', 'true'];
    helpers.passedProcessArguments.mockReturnValue(processArgs);

    const mutationInput = buildMutationVariables(
      helpers.readQuickstartFile(
        `${process.cwd()}/mock_files/mock-quickstart-2/config.yml`
      )
    );

    expect(mutationInput).toEqual(expectedMockQuickstart2MutationInput);
  });

  test('buildMutationVariables returns expected mutation input from quickstart config for submission', () => {
    const processArgs = ['url', 'false'];
    helpers.passedProcessArguments.mockReturnValue(processArgs);

    const mutationInput = buildMutationVariables(
      helpers.readQuickstartFile(
        `${process.cwd()}/mock_files/mock-quickstart-2/config.yml`
      )
    );

    expect(mutationInput).toEqual({
      ...expectedMockQuickstart2MutationInput,
      dryRun: false,
    });
  });

  test('buildMutationVariables handles an empty config file', () => {
    const processArgs = ['url', 'true'];
    helpers.passedProcessArguments.mockReturnValue(processArgs);

    const mutationInput = buildMutationVariables(
      helpers.readQuickstartFile(
        `${process.cwd()}/mock_files/mock-quickstart-4/config.yml`
      )
    );

    expect(mutationInput).toEqual(expectedMockQuickstart4MutationInput);
  });

  test('getGraphqlRequests constructs requests with a filepath and variables structure', () => {
    const processArgs = ['url', 'true'];
    helpers.passedProcessArguments.mockReturnValue(processArgs);

    const graphqlRequests = getGraphqlRequests(
      mockGitHubResponseFilenames.map(addFilenameObject)
    );

    expect(graphqlRequests.length).toEqual(2);
    expect(
      graphqlRequests.every(({ filePath }) => filePath.includes('quickstarts/'))
    ).toBeTruthy();
    expect(graphqlRequests[0].variables.id).toEqual(
      'e7948525-8726-46a5-83fa-04732ad42fd1'
    );
    expect(graphqlRequests[0].filePath).toEqual(
      'quickstarts/python/aiohttp/config.yml'
    );
  });
});

describe('countErrors', () => {
  test('no errors returns error count of 0', () => {
    const graphqlResponses = [
      {
        errors: [],
        filePath: 'fake_file_path',
      },
    ];

    const errorCount = countErrors(graphqlResponses);

    expect(errorCount).toBe(0);
  });

  test(`only 'install plan does not exist' errors returns error count of 0`, () => {
    const graphqlResponses = [
      {
        errors: [
          {
            extensions: {
              argumentPath: ['quickstartMetadata', 'installPlanStepIds'],
            },
            message:
              "`installPlanStepIds` contains an install plan step that does not exist: 'fake_install_plan'",
          },
        ],
        filePath: 'fake_file_path',
      },
    ];

    const errorCount = countErrors(graphqlResponses);

    expect(errorCount).toBe(0);
  });

  test(`for a single file with multiple errors, 'install plan does not exist' errors are not counted`, () => {
    const graphqlResponses = [
      {
        errors: [
          {
            extensions: {
              argumentPath: ['quickstartMetadata', 'installPlanStepIds'],
            },
            message:
              "`installPlanStepIds` contains an install plan step that does not exist: 'fake_install_plan'",
          },
          {
            extensions: {
              argumentPath: ['quickstartMetadata', 'description'],
            },
            message: "`description` can't be blank",
          },
          {
            extensions: {
              argumentPath: ['quickstartMetadata', 'summary'],
            },
            message: "`summary` can't be blank",
          },
        ],
        filePath: 'fake_file_path',
      },
    ];

    const errorCount = countErrors(graphqlResponses);

    expect(errorCount).toBe(2);
  });

  test('for multiple files with multiple errors each, error count is summed correctly', () => {
    const graphqlResponses = [
      {
        errors: [
          {
            extensions: {
              argumentPath: ['quickstartMetadata', 'installPlanStepIds'],
            },
            message:
              "`installPlanStepIds` contains an install plan step that does not exist: 'fake_install_plan'",
          },
          {
            extensions: {
              argumentPath: ['quickstartMetadata', 'description'],
            },
            message: "`description` can't be blank",
          },
          {
            extensions: {
              argumentPath: ['quickstartMetadata', 'summary'],
            },
            message: "`summary` can't be blank",
          },
        ],
        filePath: 'fake_file_path',
      },
      {
        errors: [
          {
            extensions: {
              argumentPath: ['quickstartMetadata', 'installPlanStepIds'],
            },
            message:
              "`installPlanStepIds` contains an install plan step that does not exist: 'fake_install_plan'",
          },
          {
            extensions: {
              argumentPath: ['quickstartMetadata', 'description'],
            },
            message: "`description` can't be blank",
          },
          {
            extensions: {
              argumentPath: ['quickstartMetadata', 'summary'],
            },
            message: "`summary` can't be blank",
          },
        ],
        filePath: 'fake_file_path_2',
      },
    ];

    const errorCount = countErrors(graphqlResponses);

    expect(errorCount).toBe(4);
  });
});
