import { mockOpenaiClient } from './openai';

// Mock the OpenAI module
const mockOpenAI = jest.fn().mockImplementation(() => mockOpenaiClient);

export default mockOpenAI;