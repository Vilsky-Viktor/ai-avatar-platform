from collections import namedtuple
import torch
import torch.nn as nn
from torch.nn import Dropout, MaxPool2d, Sequential, Conv2d, Linear
from torch.nn import BatchNorm1d, BatchNorm2d, ReLU, Sigmoid, Module, PReLU


def build_model(model_name='ir_50'):
    if model_name == 'ir_101':
        return IR_101(input_size=(112, 112))
    elif model_name == 'ir_50':
        return IR_50(input_size=(112, 112))
    elif model_name == 'ir_se_50':
        return IR_SE_50(input_size=(112, 112))
    elif model_name == 'ir_34':
        return IR_34(input_size=(112, 112))
    elif model_name == 'ir_18':
        return IR_18(input_size=(112, 112))
    else:
        raise ValueError('not a correct model name', model_name)


def initialize_weights(modules):
    for m in modules:
        if isinstance(m, nn.Conv2d):
            nn.init.kaiming_normal_(m.weight, mode='fan_out', nonlinearity='relu')
            if m.bias is not None:
                m.bias.data.zero_()
        elif isinstance(m, nn.BatchNorm2d):
            m.weight.data.fill_(1)
            m.bias.data.zero_()
        elif isinstance(m, nn.Linear):
            nn.init.kaiming_normal_(m.weight, mode='fan_out', nonlinearity='relu')
            if m.bias is not None:
                m.bias.data.zero_()


class Flatten(Module):
    def forward(self, input):
        return input.view(input.size(0), -1)


class LinearBlock(Module):
    def __init__(self, in_c, out_c, kernel=(1, 1), stride=(1, 1), padding=(0, 0), groups=1):
        super().__init__()
        self.conv = Conv2d(in_c, out_c, kernel, stride, padding, groups=groups, bias=False)
        self.bn = BatchNorm2d(out_c)

    def forward(self, x):
        return self.bn(self.conv(x))


class GNAP(Module):
    def __init__(self, in_c):
        super().__init__()
        self.bn1 = BatchNorm2d(in_c, affine=False)
        self.pool = nn.AdaptiveAvgPool2d((1, 1))
        self.bn2 = BatchNorm1d(in_c, affine=False)

    def forward(self, x):
        x = self.bn1(x)
        x_norm = torch.norm(x, 2, 1, True)
        weight = torch.mean(x_norm) / x_norm
        x = self.pool(x * weight).view(x.shape[0], -1)
        return self.bn2(x)


class GDC(Module):
    def __init__(self, in_c, embedding_size):
        super().__init__()
        self.conv_6_dw = LinearBlock(in_c, in_c, groups=in_c, kernel=(7, 7), stride=(1, 1), padding=(0, 0))
        self.conv_6_flatten = Flatten()
        self.linear = Linear(in_c, embedding_size, bias=False)
        self.bn = BatchNorm1d(embedding_size, affine=False)

    def forward(self, x):
        return self.bn(self.linear(self.conv_6_flatten(self.conv_6_dw(x))))


class SEModule(Module):
    def __init__(self, channels, reduction):
        super().__init__()
        self.avg_pool = nn.AdaptiveAvgPool2d(1)
        self.fc1 = Conv2d(channels, channels // reduction, kernel_size=1, padding=0, bias=False)
        nn.init.xavier_uniform_(self.fc1.weight.data)
        self.relu = ReLU(inplace=True)
        self.fc2 = Conv2d(channels // reduction, channels, kernel_size=1, padding=0, bias=False)
        self.sigmoid = Sigmoid()

    def forward(self, x):
        scale = self.sigmoid(self.fc2(self.relu(self.fc1(self.avg_pool(x)))))
        return x * scale


class BasicBlockIR(Module):
    def __init__(self, in_channel, depth, stride):
        super().__init__()
        self.shortcut_layer = (
            MaxPool2d(1, stride) if in_channel == depth
            else Sequential(Conv2d(in_channel, depth, (1, 1), stride, bias=False), BatchNorm2d(depth))
        )
        self.res_layer = Sequential(
            BatchNorm2d(in_channel),
            Conv2d(in_channel, depth, (3, 3), (1, 1), 1, bias=False),
            BatchNorm2d(depth), PReLU(depth),
            Conv2d(depth, depth, (3, 3), stride, 1, bias=False),
            BatchNorm2d(depth),
        )

    def forward(self, x):
        return self.res_layer(x) + self.shortcut_layer(x)


class BottleneckIR(Module):
    def __init__(self, in_channel, depth, stride):
        super().__init__()
        rc = depth // 4
        self.shortcut_layer = (
            MaxPool2d(1, stride) if in_channel == depth
            else Sequential(Conv2d(in_channel, depth, (1, 1), stride, bias=False), BatchNorm2d(depth))
        )
        self.res_layer = Sequential(
            BatchNorm2d(in_channel),
            Conv2d(in_channel, rc, (1, 1), (1, 1), 0, bias=False), BatchNorm2d(rc), PReLU(rc),
            Conv2d(rc, rc, (3, 3), (1, 1), 1, bias=False), BatchNorm2d(rc), PReLU(rc),
            Conv2d(rc, depth, (1, 1), stride, 0, bias=False), BatchNorm2d(depth),
        )

    def forward(self, x):
        return self.res_layer(x) + self.shortcut_layer(x)


class BasicBlockIRSE(BasicBlockIR):
    def __init__(self, in_channel, depth, stride):
        super().__init__(in_channel, depth, stride)
        self.res_layer.add_module("se_block", SEModule(depth, 16))


class BottleneckIRSE(BottleneckIR):
    def __init__(self, in_channel, depth, stride):
        super().__init__(in_channel, depth, stride)
        self.res_layer.add_module("se_block", SEModule(depth, 16))


class Bottleneck(namedtuple('Block', ['in_channel', 'depth', 'stride'])):
    pass


def get_block(in_channel, depth, num_units, stride=2):
    return [Bottleneck(in_channel, depth, stride)] + [Bottleneck(depth, depth, 1) for _ in range(num_units - 1)]


def get_blocks(num_layers):
    configs = {
        18:  [(64, 64, 2), (64, 128, 2), (128, 256, 2), (256, 512, 2)],
        34:  [(64, 64, 3), (64, 128, 4), (128, 256, 6), (256, 512, 3)],
        50:  [(64, 64, 3), (64, 128, 4), (128, 256, 14), (256, 512, 3)],
        100: [(64, 64, 3), (64, 128, 13), (128, 256, 30), (256, 512, 3)],
        152: [(64, 256, 3), (256, 512, 8), (512, 1024, 36), (1024, 2048, 3)],
        200: [(64, 256, 3), (256, 512, 24), (512, 1024, 36), (1024, 2048, 3)],
    }
    return [get_block(ic, d, u) for ic, d, u in configs[num_layers]]


class Backbone(Module):
    def __init__(self, input_size, num_layers, mode='ir'):
        super().__init__()
        assert input_size[0] in [112, 224]
        assert num_layers in [18, 34, 50, 100, 152, 200]
        assert mode in ['ir', 'ir_se']

        self.input_layer = Sequential(Conv2d(3, 64, (3, 3), 1, 1, bias=False), BatchNorm2d(64), PReLU(64))
        blocks = get_blocks(num_layers)

        if num_layers <= 100:
            unit_module = BasicBlockIR if mode == 'ir' else BasicBlockIRSE
            output_channel = 512
        else:
            unit_module = BottleneckIR if mode == 'ir' else BottleneckIRSE
            output_channel = 2048

        flat_dim = output_channel * (7 * 7 if input_size[0] == 112 else 14 * 14)
        self.output_layer = Sequential(
            BatchNorm2d(output_channel), Dropout(0.4), Flatten(),
            Linear(flat_dim, 512), BatchNorm1d(512, affine=False),
        )
        self.body = Sequential(*[
            unit_module(b.in_channel, b.depth, b.stride)
            for block in blocks for b in block
        ])
        initialize_weights(self.modules())

    def forward(self, x):
        x = self.input_layer(x)
        x = self.body(x)
        x = self.output_layer(x)
        norm = torch.norm(x, 2, 1, True)
        return torch.div(x, norm), norm


def IR_18(input_size):   return Backbone(input_size, 18,  'ir')
def IR_34(input_size):   return Backbone(input_size, 34,  'ir')
def IR_50(input_size):   return Backbone(input_size, 50,  'ir')
def IR_101(input_size):  return Backbone(input_size, 100, 'ir')
def IR_152(input_size):  return Backbone(input_size, 152, 'ir')
def IR_200(input_size):  return Backbone(input_size, 200, 'ir')
def IR_SE_50(input_size):  return Backbone(input_size, 50,  'ir_se')
def IR_SE_101(input_size): return Backbone(input_size, 100, 'ir_se')
def IR_SE_152(input_size): return Backbone(input_size, 152, 'ir_se')
def IR_SE_200(input_size): return Backbone(input_size, 200, 'ir_se')
